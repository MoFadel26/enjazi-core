# ADR-0015: Clerk for sign-in, a local users table for everything else

**Status:** accepted
**Date:** 2026-10-16
**Supersedes:** the cookie, password and sign-in parts of ADR-0006. Its
ownership rules stand.

## Context

ADR-0006 built sign-in on ASP.NET Identity: passwords hashed in our
`users` table, four hand-written endpoints, an `HttpOnly` cookie. Clerk now
owns accounts and sign-in instead: sign-up, email verification, password
reset, second factors and social providers, none of which this codebase
would otherwise have to write.

The mechanisms, stated before the decisions:

1. **Clerk keeps the session in the browser.** `ClerkProvider` loads Clerk's
   JavaScript, which talks to the instance's Frontend API
   (`https://<instance>.clerk.accounts.dev` for a development instance).
   `getToken()` returns a session token: a JWT signed with the instance's
   key, valid for 60 seconds, refreshed by Clerk before it expires.
2. **The API checks the token itself.** The Frontend API publishes its
   signing keys at a JWKS endpoint, found through OpenID discovery from the
   issuer URL. `AddJwtBearer` with `Authority` set to that URL downloads
   and caches the keys and checks signature, issuer and expiry. No call to
   Clerk per request, and no Clerk secret key in the API.
3. **The token says little by default.** `sub` is the Clerk user id
   (`user_2abc...`), `azp` the origin the token was minted for, and `sid`
   the session. No email and no name unless the session token is
   customised in the Clerk Dashboard.
4. **A WebSocket upgrade carries no custom headers.** Browsers cannot set
   `Authorization` on one, so SignalR's `accessTokenFactory` sends the token
   as `?access_token=` on the hub URL instead.

## Decisions

**The local users table stays, keyed by Guid, with a unique non-null
`clerk_user_id`.** Every owner foreign key, every query filter, `CurrentUser`
and the tests keep the Guid. Clerk's id format appears in one column.

Rejected: *Clerk's string id as the primary key.* Touches every user-scoped
table and every test, and ties the schema to another company's id format.

**The row is created on the user's first request.** `OnTokenValidated` looks
up `clerk_user_id = sub`, and when there is none creates the row from the
token's `email` and `name` claims. Concurrent first requests race to insert;
the unique index lets one win and the others read its row. The session token
is customised to carry the two claims:
`{"email":"{{user.primary_email_address}}","name":"{{user.full_name}}"}`.
A token without an email is refused.

Rejected: *a Clerk webhook (`user.created`) that creates the row.* Needs a
public endpoint, signature verification and a retry story, and the first
request can still arrive before the webhook. *Fetching the user from Clerk's
Backend API on first sight.* Puts the secret key in the API and a network
call in the authentication path.

**Roles and disabling stay in the local database, checked per request.**
After validation the principal gets `NameIdentifier` set to the local Guid
and one role claim per Identity role, read from the database. A locked-out
user is refused. So the Admin policy, `RequireRole`, the admin screen and
the 404-not-403 rule work unchanged, and an admin's change takes effect on
the next request. The cost is two or three small queries per request.

Rejected: *roles in Clerk's `publicMetadata`, copied into the token.* Moves
authorization out of the data layer, and a revoked role stays in tokens
until they expire.

**`Bootstrap:AdminEmail` promotes at creation.** When the row created for a
first request has that address, it gets the Admin role at once. The hosted
`AdminBootstrap` still promotes a row that existed before the setting.
Clerk verifies the primary address at sign-up, which is what makes matching
on it safe.

**Identity stays for storage only.** `AddIdentityCore` keeps the users,
roles and user_roles tables, `UserManager` and `RoleManager`. The cookie
scheme, `SignInManager`, the password policy and the register, login and
logout endpoints are gone. `GET /api/auth/me` remains: it is how the web app
learns the local id and roles.

**Bearer tokens, not Clerk's `__session` cookie.** The web client adds
`Authorization: Bearer <getToken()>` to every API request. `getToken()`
refreshes a token that is about to expire; the cookie can be stale after a
tab has been in the background. A header is also never sent by the browser
on its own, so there is no cross-site request forgery to defend against.

**`access_token` in the query string is read for `/hubs/rooms` only.**
Elsewhere a token in a URL would land in logs and history for no reason.

**`azp` must be one of `Clerk:AuthorizedParties`.** Clerk's guidance: a
token minted for another origin on the same instance is refused. The list
is configuration: `http://127.0.0.1:5182` locally, the Container Apps URL in
production, which `infra/deploy.sh` derives from the environment's domain.

**`MapInboundClaims` is off.** With it on, `sub` would arrive as
`NameIdentifier`, the claim `CurrentUser` parses as the local Guid.

**Clerk's prebuilt `<SignIn/>` and `<SignUp/>`, styled from Mantine's CSS
variables.** The `appearance` variables point at `--mantine-*` and
`--enjazi-*` custom properties, so the components follow the palette and
colour scheme with no React state. They are routed at `/login/*` and
`/register/*` so Clerk's own steps have URLs. `RequireAuth` sends
`?redirect_url=` with the path the visitor wanted, which `<SignIn/>` returns
to.

Rejected: *Mantine forms on Clerk's `useSignIn` and `useSignUp` hooks.*
Matches the design system exactly, but every flow Clerk handles (codes,
second factors, password reset, social buttons) becomes our code.

**A 401 from the API ends the Clerk session.** The fetch middleware marks
the user as signed out and `RequireAuth` calls Clerk's `signOut()`. Without
that, a disabled user with a live Clerk session would bounce between
`/login`, which sees a session, and screens the API refuses.

## Consequences

- **Disabling a user does not drop an open hub connection.** The token is
  checked when the connection is made. A disabled user keeps receiving
  pushed messages for rooms they are a member of until the connection
  drops and reconnects. Their next REST request is refused.
- Name or email changes made in Clerk do not reach the local row. Syncing
  them needs a `user.updated` webhook.
- Deleting a user in Clerk leaves the local row and its data.
- Accounts created under ADR-0006 have no Clerk id and cannot sign in. The
  `ClerkUserId` migration adds the column as non-null and unique, so it
  fails on a database with more than one such row. The local and deployed
  databases are recreated rather than migrated.
- The deployed app uses the Clerk development instance. A production
  instance needs a domain we own, and the `azurecontainerapps.io` address
  cannot be one. Development instances show a "Development mode" badge and
  have usage limits.
- The Data Protection keys table (ADR-0014) protected the auth cookie. With
  the cookie gone, nothing reads it.
- The browser tests create Clerk users through the Backend API with the
  secret key, sign in with `@clerk/testing`, and delete their users
  afterwards. They need network access to Clerk.
- The API tests do not touch Clerk. They sign tokens with a test key and
  point the bearer handler at it; everything after signature validation is
  the production code.
