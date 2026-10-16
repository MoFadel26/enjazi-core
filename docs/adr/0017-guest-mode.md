# ADR-0017: Guest mode — temporary server-side accounts with the API's own tokens

**Status:** accepted
**Date:** 2026-10-16
**Builds on:** ADR-0015 (Clerk for sign-in, a local users table for
everything else). Nothing in it is superseded.

## Context

Trying Enjazi meant creating a Clerk account first. "Try as guest" lets a
visitor use the real app, with their own data, without one. The data has to
be private like any account's, go away on its own, and carry over if the
guest signs up.

The mechanisms, stated before the decisions:

1. **ASP.NET Core picks one authentication scheme per request.** A policy
   scheme (`AddPolicyScheme`) has a `ForwardDefaultSelector` that looks at
   the request and names the scheme to run. Two JwtBearer schemes can sit
   behind it, each with its own keys and issuer, and `[Authorize]` without a
   scheme uses whichever the selector picks.
2. **Everything after authentication reads the principal only.**
   `CurrentUser` parses `NameIdentifier` as the local Guid; the EF Core query
   filters compare owner columns to it; the Admin policy reads role claims.
   None of them knows which issuer signed the token (ADR-0015).
3. **Every owner foreign key cascades.** Tasks, events, settings, streak,
   room memberships, messages, owned rooms and Identity's user_roles all
   reference users with `ON DELETE CASCADE`. Deleting a user row deletes
   everything it owns, in the same statement.
4. **ASP.NET Core's rate limiter partitions by a key the policy computes**:
   here the client address, or the user id. Behind Container Apps' ingress
   the address is only the client's once `UseForwardedHeaders` has read
   `X-Forwarded-For`.
5. **Container Apps can scale the app to zero.** A hosted service runs only
   while a replica runs.

## Decisions

### A real users row per guest, not browser storage or a shared account

`POST /api/auth/guest` (anonymous) creates a users row with `is_guest = true`
and `expires_at = now + Guest:LifetimeDays` (7 by default), seeds it, and
returns a token. Every screen, filter and policy then works unchanged,
because the guest is an ordinary row with an owner id.

Rejected: *data in `localStorage` with no account.* Every screen would need
a second data path, rooms and chat could not work, and the upgrade would
upload a blob nobody validated. *One shared demo account.* Visitors would
see and change each other's data, which is exactly the leak the ownership
rules exist to prevent.

Identity requires a unique user name and email, so a guest gets
`guest-<id>` and `guest-<id>@guest.invalid` (`.invalid` is reserved and can
never be anyone's address) and the display name `Guest 4F2A`. `clerk_user_id`
becomes nullable; Postgres's unique index allows many NULLs.

### The API signs guest tokens; one principal shape for both issuers

Guest tokens are HS256 JWTs signed with `Guest:SigningKey`, issuer
`enjazi-guest`, audience `enjazi-api`, valid 15 minutes and never past the
guest's own expiry. The default scheme, `ClerkOrGuest`, reads the token's
`iss` without validating it and forwards to the `Guest` scheme or to the
Clerk scheme (`Bearer`, unchanged), which then validates everything. A
forged issuer only chooses which key the forgery fails against.

After validation the Guest scheme loads the row and refuses the token unless
it is still a guest and `expires_at` is in the future. Then it adds
`NameIdentifier` = the local Guid and a `Guest` role claim, and never a
stored role. So:

- an expired guest gets 401 at once, whether or not cleanup has run;
- a guest token naming a real user's id is refused;
- `CurrentUser`, the query filters and the Admin policy are unchanged.

SignalR sends the same token as `?access_token=`, read on `/hubs/rooms`
only, by both schemes.

`POST /api/auth/guest/refresh` returns a new token for a token this API
signed, even an expired one, while the guest lives. A tab that slept past
15 minutes keeps its session; the guest's expiry is the limit. The web app
refreshes two minutes before a token expires and keeps the session in
`localStorage`, so a reload, another tab and a later sign-up find it.

The key comes from configuration only: a Container Apps secret in
production, user secrets locally. Without it the API still starts (the
build-time OpenAPI step runs with no configuration), `POST /api/auth/guest`
answers 503, and no guest token validates. A deploy can go out before the
secret exists.

Rejected: *one JwtBearer scheme with both issuers and a key resolver that
merges Clerk's JWKS with our key.* Possible, but it mixes Authority-based
metadata with a static key in one set of options, and the azp check and the
provisioning step would have to branch on the issuer anyway. *Cookies for
guests.* The API takes bearer tokens only since ADR-0015; a second transport
brings back cross-site request forgery.

### Restrictions

- **Admin panel:** a guest holds no stored role, so the Admin policy refuses
  it like any member (403). `AdminBootstrap.PromoteAsync` skips guests, and
  the admin screen cannot give a guest a role (400).
- **Rooms:** guests join and chat; `POST /api/rooms` requires the `NotGuest`
  policy (403). A guest creating rooms would leave shared rooms that vanish
  with their owner.
- **Guest creation:** at most `Guest:PermitsPerHour` (default 5) per client
  address per hour, fixed window, 429 with `Retry-After`.
- **Room messages:** at most 30 per minute per user, guests and accounts
  alike, fixed window, 429. Guests make an anonymous source of chat spam
  possible; the limit applies to everyone so it is one rule, not a guest
  special case.

### The client address behind the ingress

`ForwardedHeadersOptions` reads `X-Forwarded-For` and `X-Forwarded-Proto`
with `KnownIPNetworks` and `KnownProxies` cleared (the ingress address is not
fixed and the container has no other way in) and `ForwardLimit = 1`, so only
the last entry counts: the one the ingress appended. A client that sends its
own `X-Forwarded-For` only adds entries before it. Each guest creation logs
`Created guest <id> for <address>`, so the resolved address can be checked
against a real request after a deploy.

### Sample data

Five tasks, one per due group the list shows (overdue, today, this week, no
date, completed today), two events in the dashboard's seven-day window, a
three-day streak that includes today, and settings with the browser's time
zone, so "today" is the guest's today. Created in the same transaction as
the row.

### Cleanup: one DELETE, cascades do the rest

`GuestCleanup`, a hosted service, runs one minute after start and then every
15 minutes: `DELETE FROM users WHERE is_guest AND expires_at <= now()`. The
cascades remove the guest's tasks, events, settings, streak, room
memberships and messages in that statement, so it is atomic and leaves no
orphan. **A guest's room messages are deleted with the guest**, including
those in rooms other people still use: the conversation loses those lines.
The alternative, keeping them under an "expired guest" author, needs a
placeholder user and an exception to the cascade, for messages from someone
who never made an account.

**Cleanup does not run while the app is scaled to zero.** Nothing is
running to run it. Expiry is still enforced, because the Guest scheme checks
`expires_at` on every request; a missed run only leaves rows on disk until
the next replica starts, and the first run comes a minute after start, well
inside the five minutes Container Apps waits before scaling back down.

### Upgrade: the guest's row becomes the account

While a guest session exists, the web app sends the guest token as
`X-Guest-Token` alongside the Clerk token. When `ClerkUserProvisioner` meets
a Clerk user with no local row and that header carries a valid token for a
live guest, it updates the guest's row instead of inserting one: Clerk id,
email, user name and display name set, `is_guest` false, `expires_at` null.
The Guid stays, so every task, event, setting, streak and membership is
already the account's, with nothing reassigned and nothing to orphan. The
Bootstrap admin check runs as it does on creation.

Identity's concurrency stamp lets one of several concurrent first requests
win; the rest fail the update and read the winner's row, the same race
handling as creation. No transfer happens when the Clerk user already has a
row (an existing account signing in), the guest has expired, or the address
belongs to another account; the guest's data then expires on schedule. The
web app drops the guest session once a Clerk `/me` answers.

Rejected: *reassigning OwnerId across every table and deleting the guest
row.* Same result, seven UPDATEs instead of one, and a row to delete while
other requests may still be reading it.

## Consequences

- New configuration: `Guest:SigningKey` (required for guest mode),
  `Guest:LifetimeDays` (default 7), `Guest:PermitsPerHour` (default 5;
  100 in `appsettings.Development.json`, so repeated local browser runs
  from one address do not hit it). docs/deploy.md lists them.
- `infra/deploy.sh` takes an optional `GUEST_SIGNING_KEY`. It replaces the
  app's secrets and environment on every run, so once set it has to be
  passed on every run.
- The guest token sits in `localStorage`, readable by any script on the
  page. The same is true of Clerk's development-instance token; the
  protection is the app not running untrusted script.
- A guest who signs in to an existing account (rather than signing up)
  keeps two sets of data: the account's and the guest's, which expires.
- The users table holds guests. The admin list shows them with their
  `@guest.invalid` addresses until they expire.
- An open hub connection outlives a guest's expiry until it reconnects, as
  ADR-0015 notes for disabled users.
