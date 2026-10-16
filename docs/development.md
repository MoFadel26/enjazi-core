# Development

How to run Enjazi on your machine and run its tests. Ports are fixed; see
`CLAUDE.md`, "Fixed local ports".

## Setup

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

## Tests

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
