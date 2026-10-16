#!/usr/bin/env bash
# Creates or updates everything enjazi-core runs on in Azure. Safe to re-run:
# each resource is created only if it is missing, and the container app's
# configuration is applied again from the values below.
#
# Needs the az CLI, logged in (az login), and in the environment:
#   PG_ADMIN_PASSWORD  letters and digits only, 16 or more characters. Pass
#                      the same one every run; the server is set to it.
#   IMAGE              the image to run. Required on the first run, when the
#                      container app does not exist. Later runs keep the image
#                      that is running, which the deploy workflow sets.
#   ADMIN_EMAIL        optional; the account Bootstrap:AdminEmail promotes to
#                      admin once it is registered.
#
# The README, "Deploy", gives the order this fits into.
set -euo pipefail

LOCATION=northeurope
RESOURCE_GROUP=enjazi-core-rg            # also in .github/workflows/deploy.yml
PG_SERVER=enjazi-core-pg                 # globally unique: <name>.postgres.database.azure.com
PG_ADMIN_USER=enjazi
PG_DATABASE=enjazi_core
CONTAINERAPPS_ENV=enjazi-core-env
APP_NAME=enjazi-core                     # also in .github/workflows/deploy.yml

: "${PG_ADMIN_PASSWORD:?set PG_ADMIN_PASSWORD}"
# Letters and digits only, so the password needs no quoting in the connection
# string or the YAML below. Upper, lower and digits meet Azure's complexity rule.
if ! [[ "$PG_ADMIN_PASSWORD" =~ ^[A-Za-z0-9]{16,}$ ]]; then
  echo "PG_ADMIN_PASSWORD must be 16 or more letters and digits" >&2
  exit 1
fi
ADMIN_EMAIL="${ADMIN_EMAIL:-}"

echo "-- CLI extension and resource providers"
az extension add --name containerapp --upgrade --only-show-errors
for namespace in Microsoft.App Microsoft.OperationalInsights Microsoft.DBforPostgreSQL; do
  az provider register --namespace "$namespace" --wait
done

# Checked before anything slow is created, so a missing IMAGE fails at once.
app_exists=false
if az containerapp show -g "$RESOURCE_GROUP" -n "$APP_NAME" -o none 2>/dev/null; then
  app_exists=true
  IMAGE="${IMAGE:-$(az containerapp show -g "$RESOURCE_GROUP" -n "$APP_NAME" \
    --query 'properties.template.containers[0].image' -o tsv)}"
fi
: "${IMAGE:?set IMAGE, e.g. ghcr.io/mofadel26/enjazi-core:<commit sha>}"

echo "-- resource group $RESOURCE_GROUP"
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" -o none

echo "-- PostgreSQL server $PG_SERVER"
if az postgres flexible-server show -g "$RESOURCE_GROUP" -n "$PG_SERVER" -o none 2>/dev/null; then
  az postgres flexible-server update -g "$RESOURCE_GROUP" -n "$PG_SERVER" \
    --admin-password "$PG_ADMIN_PASSWORD" -o none
else
  # Public access with no firewall rule yet; the rule below admits Azure
  # services only.
  az postgres flexible-server create -g "$RESOURCE_GROUP" -n "$PG_SERVER" \
    --location "$LOCATION" \
    --version 16 --tier Burstable --sku-name Standard_B1ms --storage-size 32 \
    --high-availability Disabled \
    --admin-user "$PG_ADMIN_USER" --admin-password "$PG_ADMIN_PASSWORD" \
    --public-access None --yes -o none
fi

# On by default; set so the requirement is stated here and not assumed.
az postgres flexible-server parameter set -g "$RESOURCE_GROUP" --server-name "$PG_SERVER" \
  --name require_secure_transport --value on -o none

# 0.0.0.0 to 0.0.0.0 is Azure's notation for "any Azure service", which is how
# the container app reaches the server: its outbound address is not fixed.
az postgres flexible-server firewall-rule create -g "$RESOURCE_GROUP" --name "$PG_SERVER" \
  --rule-name AllowAzureServices --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 -o none

if ! az postgres flexible-server db show -g "$RESOURCE_GROUP" --server-name "$PG_SERVER" \
    --database-name "$PG_DATABASE" -o none 2>/dev/null; then
  az postgres flexible-server db create -g "$RESOURCE_GROUP" --server-name "$PG_SERVER" \
    --database-name "$PG_DATABASE" -o none
fi

PG_HOST=$(az postgres flexible-server show -g "$RESOURCE_GROUP" -n "$PG_SERVER" \
  --query fullyQualifiedDomainName -o tsv)
# VerifyFull: encrypted, and the server certificate is checked against the
# system CA store and the host name.
CONNECTION="Host=$PG_HOST;Port=5432;Database=$PG_DATABASE;Username=$PG_ADMIN_USER;Password=$PG_ADMIN_PASSWORD;SSL Mode=VerifyFull"

echo "-- Container Apps environment $CONTAINERAPPS_ENV"
if ! az containerapp env show -g "$RESOURCE_GROUP" -n "$CONTAINERAPPS_ENV" -o none 2>/dev/null; then
  az containerapp env create -g "$RESOURCE_GROUP" -n "$CONTAINERAPPS_ENV" \
    --location "$LOCATION" -o none
fi
ENV_ID=$(az containerapp env show -g "$RESOURCE_GROUP" -n "$CONTAINERAPPS_ENV" --query id -o tsv)

echo "-- container app $APP_NAME"

admin_env=""
if [ -n "$ADMIN_EMAIL" ]; then
  admin_env="
          - name: Bootstrap__AdminEmail
            value: \"$ADMIN_EMAIL\""
fi

# The spec holds the connection string, so it is private and deleted on exit.
spec=$(mktemp)
chmod 600 "$spec"
trap 'rm -f "$spec"' EXIT

# Probes: startup and readiness call /healthz, which checks the database.
# Liveness only checks the port is open, so a database outage takes the
# replica out of rotation instead of restarting it over and over. Container
# Apps caps failureThreshold at 10, so the startup window, which covers
# migrations and a cold database, is 10s + 10 x 10s.
cat > "$spec" <<YAML
location: $LOCATION
name: $APP_NAME
properties:
  managedEnvironmentId: $ENV_ID
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 8080
      transport: auto
      allowInsecure: false
    secrets:
      - name: db-connection
        value: "$CONNECTION"
  template:
    containers:
      - name: $APP_NAME
        image: $IMAGE
        resources:
          cpu: 0.5
          memory: 1Gi
        env:
          - name: ConnectionStrings__Default
            secretRef: db-connection
          - name: ASPNETCORE_HTTPS_PORT
            value: "443"$admin_env
        probes:
          - type: Startup
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 10
          - type: Readiness
            httpGet:
              path: /healthz
              port: 8080
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          - type: Liveness
            tcpSocket:
              port: 8080
            periodSeconds: 10
            failureThreshold: 3
    scale:
      minReplicas: 0
      maxReplicas: 1
YAML

if $app_exists; then
  az containerapp update -g "$RESOURCE_GROUP" -n "$APP_NAME" --yaml "$spec" -o none
else
  az containerapp create -g "$RESOURCE_GROUP" -n "$APP_NAME" --yaml "$spec" -o none
fi

echo "-- done"
echo "https://$(az containerapp show -g "$RESOURCE_GROUP" -n "$APP_NAME" \
  --query properties.configuration.ingress.fqdn -o tsv)"
