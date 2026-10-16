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
- **Guest mode** — "Try as guest" opens the app with sample data and no account. The guest's data is deleted after 7 days, or kept if they sign up (ADR-0017).

Everything is private to you unless it's in a room. That's enforced in the
database layer, not by checks scattered through the code.

## Built with

ASP.NET Core 10 and PostgreSQL on the back end. React 19, TypeScript and
Mantine on the front end, with types generated from the API so the two can't
drift apart.

## Running it

Needs .NET 10, Node 22+, PostgreSQL 16+ and a Clerk application, which
handles sign-up and sign-in (ADR-0015).

Clerk, once:

1. In the Clerk Dashboard, under Sessions, "Customize session token", set
   `{"email":"{{user.primary_email_address}}","name":"{{user.full_name}}"}`.
   The API creates its own user row from these two claims. Under User &
   authentication, turn usernames off and first and last names on; the
   browser tests create users with an email, a password and a first name.
2. Write the publishable key to `src/Enjazi.Web/.env.local`:

   ```sh
   cd src/Enjazi.Web
   npx -y clerk@latest auth login
   npx -y clerk@latest link --app <application id>
   npx -y clerk@latest env pull
   ```

3. Set `Clerk:Authority` in `src/Enjazi.Api/appsettings.Development.json` to
   the instance's Frontend API URL, e.g. `https://example-1.clerk.accounts.dev`.
4. For the browser tests only: put `CLERK_SECRET_KEY=sk_test_...` in
   `src/Enjazi.Web/.env.test.local`. Both `.env` files are ignored by git.

Guest mode needs a signing key, kept in user secrets, outside the repository
(ADR-0017):

```sh
dotnet user-secrets set Guest:SigningKey "$(openssl rand -base64 48)" --project src/Enjazi.Api
```

Deleting a Clerk account from Settings needs the instance's secret key, in
user secrets too (ADR-0019). Without it the API answers 503 and nothing is
deleted; guests can delete theirs either way:

```sh
dotnet user-secrets set Clerk:SecretKey sk_test_... --project src/Enjazi.Api
```

Then:

```sh
createdb enjazi_core
dotnet ef database update --project src/Enjazi.Api
dotnet run --project src/Enjazi.Api                # API

cd src/Enjazi.Web && npm install && npm run dev    # app
```

Then open `http://127.0.0.1:5182` and register an account.

### Tests

`scripts/verify-phase-3.sh` runs the API tests against a throwaway Postgres
container. `scripts/verify-phase-9.sh` runs every check, ending in the
browser suite against the API on 5180; `npm run e2e` in `src/Enjazi.Web` runs
the browser suite alone.

Most browser tests sign in through the Clerk development instance, which
rate-limits. Under parallel workers they can time out inside Clerk's sign-in
(`e2e/session.ts`) or fail with "fetch failed" from Clerk's API, with nothing
wrong in the app. If that happens, re-run what failed with one worker:

```sh
npx playwright test --last-failed --workers=1
```

or the whole suite with `--workers=1`. The guest tests do not use Clerk.

## Deploy

Production is one container on Azure Container Apps, in front of Azure
Database for PostgreSQL Flexible Server 16. The container serves the API,
the chat hub at `/hubs/rooms` and the built React app from one origin
(ADR-0008). ADR-0014 records the decisions; ADR-0015 covers sign-in.

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
| `Clerk__Authority` | `infra/deploy.sh`, from `CLERK_AUTHORITY` | Clerk Frontend API URL. Session tokens are checked against its signing keys |
| `Clerk__AuthorizedParties__0` | `infra/deploy.sh` | `https://<app>.<environment domain>`, the only origin whose tokens are accepted |
| `Bootstrap__AdminEmail` | `infra/deploy.sh`, from `ADMIN_EMAIL`, only if set | Account made admin on its first sign-in |
| `Guest__SigningKey` | `infra/deploy.sh`, from `GUEST_SIGNING_KEY`, as the Container Apps secret `guest-signing-key`, only if set | Base64, 32 or more bytes (`openssl rand -base64 48`). Signs guest tokens. Without it guest mode is off and `POST /api/auth/guest` answers 503 |
| `Clerk__SecretKey` | `infra/deploy.sh`, from `CLERK_SECRET_KEY`, as the Container Apps secret `clerk-secret-key`, only if set | Clerk secret key. Deletes the Clerk user when someone deletes their account (ADR-0019). Without it `DELETE /api/auth/me` answers 503 for a Clerk account; a guest can still delete theirs |
| `Guest__LifetimeDays` | not set; default `7` | Days until a guest account and its data are deleted |
| `Guest__PermitsPerHour` | not set; default `5` | Guest accounts one client address can create per hour |
| `ASPNETCORE_HTTPS_PORT` | `infra/deploy.sh` | `443`, the port HTTP requests are redirected to |
| `Database__MigrateOnStartup` | `Dockerfile` | `true`. Applies pending migrations before the app starts |
| `ASPNETCORE_HTTP_PORTS` | `Dockerfile` | `8080` |
| `ASPNETCORE_ENVIRONMENT` | .NET image default | `Production` |

`infra/deploy.sh` itself reads:

| Variable | Required | Value |
|---|---|---|
| `PG_ADMIN_PASSWORD` | always | 16 or more letters and digits. Use the same value on every run; the server is set to it |
| `IMAGE` | first run | Image to run. Later runs keep the running one unless this is set |
| `CLERK_AUTHORITY` | always | Clerk Frontend API URL, e.g. `https://example-1.clerk.accounts.dev` |
| `ADMIN_EMAIL` | no | Becomes `Bootstrap__AdminEmail` |
| `GUEST_SIGNING_KEY` | no, but pass it on every run once set | Becomes `Guest__SigningKey`. A run without it removes the secret |
| `CLERK_SECRET_KEY` | no, but pass it on every run once set | Becomes `Clerk__SecretKey`. A run without it removes the secret |

The image build reads `VITE_CLERK_PUBLISHABLE_KEY`, the Clerk publishable
key, which Vite writes into the bundle. The workflow passes it from the
repository variable of the same name. It is public, so it is a variable and
not a secret.

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
   az group create --name enjazi-core-rg --location centralindia
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
   gh variable set VITE_CLERK_PUBLISHABLE_KEY --body "pk_test_..."
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
   export CLERK_AUTHORITY=https://example-1.clerk.accounts.dev
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

7. If `ADMIN_EMAIL` was set: sign up in the app with that address. It is an
   admin from its first request.

From then on every push to `main` that passes the checks is deployed.

### Running the image locally

```sh
docker network create enjazi
docker run -d --name enjazi-pg --network enjazi \
  -e POSTGRES_PASSWORD=local -e POSTGRES_DB=enjazi_core postgres:16
docker build -t enjazi-core --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_... .
docker run --rm --name enjazi-app --network enjazi -p 127.0.0.1:8080:8080 \
  -e ConnectionStrings__Default="Host=enjazi-pg;Database=enjazi_core;Username=postgres;Password=local" \
  -e Clerk__Authority=https://example-1.clerk.accounts.dev \
  -e Clerk__AuthorizedParties__0=http://127.0.0.1:8080 \
  enjazi-core
```

Then open `http://127.0.0.1:8080`.

## Digging deeper

`docs/plan.md` is what was built and in what order. `docs/adr/` holds the
decisions and the reasoning behind each one. `docs/design.md` is the visual
spec.
