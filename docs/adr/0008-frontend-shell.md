# ADR-0008: Frontend shell — one origin, a generated client, and auth in the query cache

**Status:** accepted
**Date:** 2026-09-23

## Context

Phase 4 stands up the frontend: Vite, React 19, TypeScript, Mantine, TanStack
Query, routing, the auth flow and the app layout. The API is finished and its
OpenAPI document is committed (ADR-0007). Auth is an `HttpOnly` cookie named
`enjazi_core_auth`, marked `Secure`, on an API that runs locally over plain
HTTP on `127.0.0.1:5180` (ADR-0006, and "Fixed local ports" in `CLAUDE.md`).

The mechanism the shell is built on, stated before the decisions:

1. The browser loads the app from `127.0.0.1:5182` and calls `/api/...` on
   that same origin. The Vite dev server forwards those requests to the API.
2. Login answers with `Set-Cookie`. Because the response arrives from the
   app's own origin, the cookie is first-party and rides on every later
   request without the client doing anything.
3. `GET /api/auth/me` is the one question the app asks on load: 200 with the
   user, or 401. The answer is cached, and every protected route reads it.
4. A protected route with no user redirects to `/login`, remembering where the
   user was going. Login or registration writes the returned user into the
   cache, and the redirect reverses.
5. Logout asks the API to drop the cookie, clears the cache and returns to
   `/login`. A later load asks `/me` again and gets 401, so the sign-out is
   the server's, not the client's.

## Decisions

### The dev server proxies `/api`; there is no CORS configuration

`vite.config.ts` forwards `/api` to `http://127.0.0.1:5180`. The browser sees
one origin, so the cookie is first-party and `SameSite=Lax` is never in the
way. The client uses relative URLs, which also hold in production behind one
host. The API is untouched.

Rejected: *calling the API directly across ports.* Cookies ignore ports, so
the cookie would still be sent, but the origins differ, so the API would need
`AddCors` with `AllowCredentials` and an explicit origin list, plus
`credentials: "include"` on every request. That is a second configuration to
keep aligned for no benefit.

### Plain HTTP on loopback, with a `Secure` cookie

The API sets the cookie with `Secure` and serves it over HTTP. Chromium and
Firefox treat `127.0.0.1` and `localhost` as a secure context and accept
`Secure` cookies from them, so the documented `dotnet run` and `npm run dev`
work as they are. Safari does not, so local development in Safari does not
sign in. If that matters, the fix is the `https` launch profile (port 5181)
plus Vite's `server.https` using the exported .NET development certificate.
That was not done now because it adds a certificate export step to setup for
a browser nobody on this project develops in.

### The client is generated from `openapi.json` and committed

`openapi-typescript` turns the committed document into
`src/api/schema.d.ts`, types only, no runtime. `openapi-fetch` is a typed
`fetch` over those types: paths, parameters, bodies and per-status responses
are checked, and the module is under 6 kB. `openapi-react-query` wraps it in
`useQuery`/`useMutation` with query keys derived from the request. Together
the request and response types originate in the C# contracts, which is what
the plan required.

The generated file is committed, and `scripts/verify-phase-4.sh` regenerates
it and fails on a difference, mirroring how `openapi.json` itself is checked.
The operation ids ADR-0007 set appear as `operations["Tasks_Get"]` and so on.

Rejected:

- *`@hey-api/openapi-ts`.* Generates an SDK function per operation and a
  TanStack Query plugin, so less code to write per screen. Also generates
  several runtime files, changes its output shape between minor versions, and
  is the heavier dependency. The three-package option is smaller and stable.
- *Hand-written fetch wrappers with hand-written types.* The types would
  drift from the API with nothing to catch it.

### The signed-in user lives in the query cache, not in a context

`useCurrentUser()` is a `useQuery` on `/api/auth/me` with `staleTime:
Infinity`. `null` means the API said 401; `undefined` means not yet asked.
Login and register call `setQueryData` with the user the API returned, so the
app never refetches `/me` to learn what it was just told. Logout clears the
cache and sets `null`.

A middleware on the fetch client sets `null` on any 401 outside `/api/auth/`.
That is the expired-cookie case: the next render of `RequireAuth` redirects,
wherever the 401 came from. No Phase 4 screen makes such a call, so the
Phase 4 test does not exercise it; the first Phase 5 screen should.

Rejected: *a React context with a `useEffect` fetch.* It re-implements
loading, error and caching that TanStack Query already provides, and the
user would be the one piece of server state held differently from the rest.

### React Router 8 in data mode

Route objects in `router.tsx`, `RouterProvider` from `react-router/dom`.
`RequireAuth` is a layout route with an `Outlet`, so protection is a matter of
nesting: a route is protected by being its child, not by remembering a
wrapper. `AppLayout` nests inside it the same way.

Rejected: *TanStack Router.* Typed params and search params, which nothing
here uses yet, at the cost of a route-generation step. Reconsider if Phase 5
accumulates enough parameterised routes to need it.

### oxlint, with `no-explicit-any` as an error

Vite 8's template ships oxlint instead of ESLint. The one rule the plan
requires, no `any`, is `typescript/no-explicit-any` set to `error`, and the
generated `schema.d.ts` is excluded because it contains none but is not code
anyone edits. `--deny-warnings` makes the lint step a pass or fail.

### Playwright drives the verification

The Phase 4 check is behavioural (login, redirect, logout) and the plan says
"against the running API", so the test is a browser driving the real app
against the real API with nothing mocked. Playwright starts the dev server;
`scripts/verify-phase-4.sh` starts the API if it is not already listening.
Each run registers its own account in the local development database, so the
test needs that database migrated and leaves one extra user per run.

Rejected: *component tests with a mocked API.* They would pass with a broken
proxy, a wrong cookie name or a CORS failure, which are the things this phase
can get wrong.

### Smaller choices

- TypeScript is `~5.9`, not 6, because `openapi-typescript` 7 declares a
  `^5` peer range and `npm install` refuses the tree otherwise.
- The project lives at `src/Enjazi.Web`, beside `src/Enjazi.Api`.
- The navbar links only to screens that exist. Phase 5 adds a link with each
  screen.

## Consequences

- Any contract change is now a three-file diff: the C# contract,
  `openapi.json`, and `schema.d.ts`; `verify-phase-4.sh` fails if the third
  is missing.
- The proxy target is the API's HTTP port. Running the API on the `https`
  profile alone would leave the proxy with nothing to forward to.
- `scripts/verify-phase-4.sh` needs the local Postgres database migrated and
  downloads Chromium on first run.
- Safari is unsupported for local development until the HTTPS setup above is
  done.
