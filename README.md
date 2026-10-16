# Enjazi

A productivity web app. You keep your tasks and calendar in one place, join
rooms to work alongside other people, and build a streak by finishing
something every day.

## What it does

- **Tasks** — create, prioritise, set a due date, tick off. Grouped by when they're due; overdue ones stand out.
- **Calendar** — a week grid you can drag events around in.
- **Rooms** — shared spaces with live chat. Anyone can see a room and join it.
- **Streaks** — finish a task each day to keep a run going and collect points.
- **Settings** — light or dark theme, time zone, notification preferences.
- **Admin panel** — search accounts, assign roles, disable users.
- **Keyboard** — `N` for a new task, `G` then a letter to switch screens, `⌘K` for everything else.

Everything is private to you unless it's in a room. That's enforced in the
database layer, not by checks scattered through the code.

## Built with

ASP.NET Core 10 and PostgreSQL on the back end. React 19, TypeScript and
Mantine on the front end, with types generated from the API so the two can't
drift apart.

## Running it

Needs .NET 10, Node 22+ and PostgreSQL 16+.

```sh
createdb enjazi_core
dotnet ef database update --project src/Enjazi.Api
dotnet run --project src/Enjazi.Api                # API

cd src/Enjazi.Web && npm install && npm run dev    # app
```

Then open `http://127.0.0.1:5182` and register an account.

## Deploy

Production is one container on Azure Container Apps, in front of Azure
Database for PostgreSQL Flexible Server 16. The container serves the API,
the chat hub at `/hubs/rooms` and the built React app from one origin, which
the auth cookie and the hub depend on (ADR-0008). ADR-0014 records the
decisions.

- `Dockerfile` builds the image: Node builds the app, the .NET SDK publishes
  the API, and the app goes into the API's `wwwroot`. It listens on 8080 as a
  non-root user.
- `.github/workflows/deploy.yml` runs on every push to `main`: API tests,
  frontend typecheck and lint, then pushes
  `ghcr.io/mofadel26/enjazi-core:<commit sha>` and points the container app
  at it.
- `infra/deploy.sh` creates or updates the Azure resources. It is safe to
  run again. Region and names are variables at its top; the resource group
  and app name are repeated in the workflow and must match.
- Pending migrations are applied when the container starts.
- `/healthz` answers 200 when the database answers, 503 when not.

### Configuration

Every setting the container reads comes from its environment. Nothing secret
is in `appsettings*.json` or in the image.

| Variable | Set by | Value |
|---|---|---|
| `ConnectionStrings__Default` | `infra/deploy.sh`, as the Container Apps secret `db-connection` | Npgsql connection string with `SSL Mode=VerifyFull` |
| `Bootstrap__AdminEmail` | `infra/deploy.sh`, from `ADMIN_EMAIL`, only if set | Account promoted to admin at startup, once it is registered |
| `ASPNETCORE_HTTPS_PORT` | `infra/deploy.sh` | `443`, the port HTTP requests are redirected to |
| `Database__MigrateOnStartup` | `Dockerfile` | `true`. Applies pending migrations before the app starts |
| `ASPNETCORE_HTTP_PORTS` | `Dockerfile` | `8080` |
| `ASPNETCORE_ENVIRONMENT` | .NET image default | `Production` |

`infra/deploy.sh` itself reads:

| Variable | Required | Value |
|---|---|---|
| `PG_ADMIN_PASSWORD` | always | 16 or more letters and digits. Use the same value on every run; the server is set to it |
| `IMAGE` | first run | Image to run. Later runs keep the running one unless this is set |
| `ADMIN_EMAIL` | no | Becomes `Bootstrap__AdminEmail` |

The workflow reads three repository secrets: `AZURE_CLIENT_ID`,
`AZURE_TENANT_ID` and `AZURE_SUBSCRIPTION_ID`. They identify the Azure
identity it signs in as through OpenID Connect; no Azure password is stored
anywhere.

### One-time setup

Needs the Azure CLI and the GitHub CLI, both signed in.

1. Pick the subscription and create the resource group:

   ```sh
   az login
   az account set --subscription "<subscription name or id>"
   az group create --name enjazi-core-rg --location northeurope
   ```

2. Create the identity the workflow signs in as, trust GitHub's tokens for
   pushes to `main`, and give it Contributor on the resource group only:

   ```sh
   SUBSCRIPTION_ID=$(az account show --query id -o tsv)
   TENANT_ID=$(az account show --query tenantId -o tsv)
   APP_ID=$(az ad app create --display-name enjazi-core-github --query appId -o tsv)
   az ad sp create --id "$APP_ID"
   az ad app federated-credential create --id "$APP_ID" --parameters '{
     "name": "github-main",
     "issuer": "https://token.actions.githubusercontent.com",
     "subject": "repo:MoFadel26/enjazi-core:ref:refs/heads/main",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   az role assignment create --assignee "$APP_ID" --role Contributor \
     --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/enjazi-core-rg"
   gh secret set AZURE_CLIENT_ID --body "$APP_ID"
   gh secret set AZURE_TENANT_ID --body "$TENANT_ID"
   gh secret set AZURE_SUBSCRIPTION_ID --body "$SUBSCRIPTION_ID"
   ```

3. Push `main` and wait for the workflow:

   ```sh
   git push origin main
   gh run watch
   ```

   The image job pushes the first image. The deploy job fails this one
   time, because the container app does not exist until step 5.

4. Make the image public so Container Apps can pull it without a
   credential. Open
   `https://github.com/users/MoFadel26/packages/container/enjazi-core/settings`,
   then "Change visibility" and choose Public. GitHub has no CLI or API for
   this.

5. Create the database, the Container Apps environment and the app:

   ```sh
   export PG_ADMIN_PASSWORD=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32)
   echo "$PG_ADMIN_PASSWORD"    # store it; every later run needs the same value
   export IMAGE=ghcr.io/mofadel26/enjazi-core:$(git rev-parse origin/main)
   export ADMIN_EMAIL=you@example.com    # optional
   infra/deploy.sh
   ```

   The last line it prints is the app's URL. The first start applies the
   migrations, so the first request can take a minute.

6. Re-run the deploy job from step 3 so the run goes green. It sets the
   image that is already running.

   ```sh
   gh run rerun --failed
   ```

7. If `ADMIN_EMAIL` was set: register that account in the app, then restart
   the app so the bootstrap promotes it.

   ```sh
   az containerapp revision restart --name enjazi-core --resource-group enjazi-core-rg \
     --revision "$(az containerapp show --name enjazi-core --resource-group enjazi-core-rg \
       --query properties.latestRevisionName -o tsv)"
   ```

From then on every push to `main` that passes the checks is deployed.

### Running the image locally

```sh
docker network create enjazi
docker run -d --name enjazi-pg --network enjazi \
  -e POSTGRES_PASSWORD=local -e POSTGRES_DB=enjazi_core postgres:16
docker build -t enjazi-core .
docker run --rm --name enjazi-app --network enjazi -p 127.0.0.1:8080:8080 \
  -e ConnectionStrings__Default="Host=enjazi-pg;Database=enjazi_core;Username=postgres;Password=local" \
  enjazi-core
```

Then open `http://127.0.0.1:8080`.

## Digging deeper

`docs/plan.md` is what was built and in what order. `docs/adr/` holds the
decisions and the reasoning behind each one. `docs/design.md` is the visual
spec.
