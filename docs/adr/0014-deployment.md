# ADR-0014: Deployment — one container on Azure Container Apps

**Status:** accepted
**Date:** 2026-10-15

## Context

The app has to run somewhere other than this machine. The infrastructure is
fixed: Azure Container Apps on the consumption plan, at most one replica and
scaled to zero when idle, with external HTTPS ingress to port 8080; Azure
Database for PostgreSQL Flexible Server 16 on B1ms with SSL required; the
image in GitHub Container Registry.

The mechanisms, stated before the decisions:

1. **The ingress ends TLS.** Container Apps accepts HTTPS, then forwards
   plain HTTP to the container with `X-Forwarded-For` and
   `X-Forwarded-Proto`. Without reading those headers the app sees every
   request as HTTP: the HTTPS redirect would send each request back to
   itself, and the request would not match the `Secure` auth cookie.
2. **The cookie is encrypted with Data Protection keys.** By default the keys
   live in a folder in the container's file system. A restart, a new
   revision or a scale up from zero starts with an empty folder, makes new
   keys, and cannot read any cookie issued before. Every user is signed out.
3. **The build starts the app.** `openapi.json` is regenerated on every build
   by running `Program.cs` up to the point the host starts (ADR-0007). It
   runs as the `Production` environment and has no database.
4. **Health probes call the container directly**, over HTTP on port 8080,
   not through the ingress, and treat any 2xx or 3xx as healthy.

## Decisions

### One image serves the API, the hub and the React app

The Dockerfile builds the React app with Node 22, publishes the API with the
.NET 10 SDK, and copies the app into the API's `wwwroot`. `Program.cs` serves
it with `UseDefaultFiles` and `UseStaticFiles`, and `MapFallbackToFile` sends
any other path to `index.html` so a hard refresh on `/tasks` works. The
fallback's route excludes `/api` and `/hubs`: an unknown API path stays a
404 instead of answering 200 with a web page, and an API path with the wrong
method stays a 405.

The browser keeps seeing one origin, so nothing in ADR-0008 changes: the
cookie is first-party, the hub gets it on the WebSocket upgrade, and there is
no CORS configuration.

Rejected: *the app on Azure Static Web Apps and the API on Container Apps.*
Two origins, so CORS with credentials, a cookie that is third-party to the
app's origin, and the hub on a different host from the page.

### Forwarded headers are trusted from any proxy

`UseForwardedHeaders` runs first and reads `X-Forwarded-For` and
`X-Forwarded-Proto`. The ingress proxy's address is not fixed, so the known
proxy and network lists are cleared. That would let a client forge the
headers if it could reach the container directly; on Container Apps the
ingress is the only way in.

### Data Protection keys are stored in PostgreSQL

`PersistKeysToDbContext<AppDbContext>` with a `data_protection_keys` table,
added by a migration. Every replica and every restart reads the same keys.
The application name is set to `enjazi-core` so the key isolation does not
follow the content root path.

Rejected: *Azure Blob Storage with Key Vault encryption.* The recommended
setup for multiple apps sharing keys, and two more resources for one app
that already has a database. Note that the keys are stored unencrypted, so
anyone who can read the database can read the keys; that is the same person
who can read every row anyway.

### Migrations are applied at startup

`Program.cs` runs `Database.Migrate()` before the host starts when
`Database:MigrateOnStartup` is true. Only the Dockerfile sets it. It is not
tied to the `Production` environment because the build-time OpenAPI
generator also runs as `Production`, without a database, and would fail.

It is safe here because the app never runs as more than one replica, so two
instances never race to migrate. It needs nothing beyond the app's own
connection string, and the migration runs from inside Azure, which the
database firewall already admits.

Rejected: *a migration bundle (`dotnet ef migrations bundle`) run by the
workflow before the deploy.* The GitHub runner would need a path to the
database: a firewall rule for GitHub's address ranges, or a temporary rule
per run, plus the connection string as a GitHub secret. A bundle run as a
Container Apps job avoids that, at the cost of a second image or entrypoint
and a job resource. Either is the right call once there is more than one
replica.

### `/healthz` checks the database and runs before the HTTPS redirect

`AddDbContextCheck<AppDbContext>` opens a connection. The middleware sits
before `UseHttpsRedirection`: a probe is plain HTTP, and a redirect would be
counted as healthy without the database being asked. Startup and readiness
probes use it; liveness only checks the port, so a database outage takes the
replica out of rotation instead of restarting it in a loop.

### Configuration comes from the environment

The connection string is a Container Apps secret exposed as
`ConnectionStrings__Default`. The workflow signs in to Azure with OpenID
Connect through a federated credential, so no Azure password is stored in
GitHub. `infra/deploy.sh` takes the database password from the environment of
whoever runs it.

The app connects as the server's admin login. A separate role with rights on
one database would be tighter, and needs `psql` access to the server from
outside Azure to create it, which the firewall does not allow.

## Consequences

- Local development runs migrations on the development database, which now
  also holds the Data Protection keys. Sessions from before this change are
  signed out once.
- Scaling past one replica needs the migration moved out of startup, and a
  SignalR backplane so a message reaches users connected to other replicas.
- The first push after setup has a failing deploy job, because the container
  app is created after the first image exists. The README gives the order.
- The image on GHCR is public, so Container Apps pulls it without a stored
  credential. It contains no secrets.
