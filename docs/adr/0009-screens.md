# ADR-0009: Screens — feature folders, the query wrapper as the data layer, and what the first screens found

**Status:** accepted
**Date:** 2026-09-24

## Context

Phase 5 puts a screen on every endpoint Phase 3 built: dashboard, tasks,
calendar, rooms, settings, admin. The plan's check is that every screen is
typed against the generated client and that no screen file passes roughly 200
lines. The previous version failed both, and its 895-line calendar page is
the reason ADR-0003 and ADR-0004 exist.

The mechanism the screens are built on, stated before the decisions:

1. `openapi-react-query` wraps every operation in the document as
   `api.useQuery('get', '/api/tasks')` or `api.useMutation('put',
   '/api/tasks/{id}')`. Paths, parameters, bodies and responses are checked
   against `schema.d.ts`, so a screen cannot ask for a field the API does
   not send.
2. Its query key is `[method, path, init]`, with the path still holding its
   template. Every mutation ends by invalidating the queries whose path
   starts with the resource's prefix, so `/api/rooms` and
   `/api/rooms/{id}` refetch together, and the server's answer replaces
   whatever the cache had. Nothing patches the cache by hand, with one
   exception noted below.
3. The wrapper throws the parsed error body when `openapi-fetch` reports
   one, which is how a failed mutation reaches `mutation.error` and a failed
   query reaches `error`. The API's failures are ProblemDetails, so one
   helper turns any of them into a sentence.
4. FullCalendar owns the visible week. It reports the window on mount and on
   every navigation, the window is the events query's parameter, and the
   query's answer is the calendar's `events` prop. A drag moves the event on
   screen first; the handler persists it and reverts it if the API refuses.

## Decisions

### One folder per feature, data apart from layout

`src/tasks`, `src/calendar`, `src/rooms`, `src/settings`, `src/admin` and
`src/dashboard` each hold a `queries.ts` with the hooks over the generated
client, a screen, and the modals the screen opens. Screens hold state and
layout and call the hooks; forms are modals with their own mutation; lists
are their own component. The longest file is `RoomScreen.tsx` at 113 lines,
and `scripts/verify-phase-5.sh` fails on any source file over 200, not only
screens, so a screen cannot meet the limit by moving lines into a helper of
the same shape.

The auth screens stay in `src/screens`, where Phase 4 put them.

### Bodiless failures are given a body in the fetch middleware

`NotFound()` and a refused authorization policy answer with `Content-Length:
0`. `openapi-fetch` parses that to `error: undefined`, and the wrapper only
throws on a truthy error, so a 404 room would have rendered as a loaded room
with no data. The middleware in `client.ts` replaces any failed, bodiless
response with one carrying a ProblemDetails body, so those failures throw
like every other. This sits next to the 401 handling from ADR-0008 and is
the only place that reads raw responses.

### The first Phase 5 screen exercises the expired-cookie path

ADR-0008 left the 401 middleware untested because no Phase 4 screen called
anything but `/api/auth/`. `tasks.spec.ts` now clears the cookie and
navigates client-side; the cached user still says signed in, the tasks
request answers 401, and the redirect follows without a reload.

### Tasks filter in the browser; admin users page on the server

`GET /api/tasks` has no filter parameter and a personal list is small, so
the Open/Done/All control filters the one response. `GET /api/admin/users`
pages and searches on the server, so `mantine-datatable` is used in its
server-side mode: it receives one page and the total, and asks for the next
page by number. The search box is debounced and resets the page. Roles are
a checkbox per known role and sent wholesale, as the API requires; the only
known role is `Admin`, held as a constant in the admin folder.

### The calendar

- `datesSet` drives a `range` state, `useEvents(range)` asks the API for
  that window with `keepPreviousData` so the grid does not blank while the
  next week loads, and the adapter maps the answer to `EventInput`.
- Drag and resize both call the same handler, which sends the whole event
  body over PUT with the new times and calls `info.revert()` on failure. The
  API has no PATCH, so the adapter copies the untouched fields from the last
  response.
- All-day events are stored as the instants of local midnight, because that
  is what a selection in the all-day row hands over. The adapter turns them
  back into `YYYY-MM-DD` strings for display, because a "Z" instant is
  converted to the browser's zone before FullCalendar drops the time, which
  west of UTC lands on the previous day.
- The calendar shows the browser's time zone. The time zone in settings is
  stored and validated but not applied to the grid; it is a preference for
  reminders, which do not exist yet. Applying it to the grid is a decision
  for whoever builds reminders.
- The Mantine bridge stylesheet is carried over from the spike unchanged,
  minus the per-category rules. It was checked in light and dark mode there,
  not again here.
- The calendar and admin routes load lazily. FullCalendar is the largest
  dependency and most visits never open it. Minified, the main chunk went
  from 1,137 kB to 754 kB; the calendar is a 296 kB chunk and the admin
  table an 87 kB one, each fetched on first visit. A lazy route needs a
  `hydrateFallbackElement` on an ancestor or React Router warns on the
  first load; it is on the `RequireAuth` route and is the same loader
  `RequireAuth` shows while `/me` is pending.

### Rooms follow ADR-0007 to the letter

Every room is listed with Join or Open. Members are asked for only when the
API says the caller is a member, since a non-member gets 404. Whether the
caller administers the room is read from their own membership row, not from
`ownerId`, so a transferred admin role would show up without a change here.
The creator has no Remove button because the API refuses it; Leave is
hidden from the creator for the same reason and Delete is offered instead.

### Settings: the server's theme wins

`ColorSchemeSync` in the layout reads the settings query and sets Mantine's
colour scheme when it loads. Mantine also remembers the scheme in
`localStorage`, so the screen is right before the query answers and the
account's choice corrects it after. The settings PUT is the one mutation
that writes the cache directly: it answers with the saved settings, and
refetching what was just returned would be a second request for the same
bytes.

### Confirmation and errors use Mantine's own packages

`@mantine/modals` for confirm dialogs and `@mantine/notifications` for
failures that happen outside a form (a refused drag, a failed delete).
Both are part of Mantine, so ADR-0003's one-design-system rule holds. No
icon package was added; actions are text buttons.

### The admin route is protected by nesting

`RequireRole` is a layout route under `RequireAuth`, the same way
`RequireAuth` sits under the router: an admin route is one that lives under
it. Anyone else is sent to `/`. The API refuses them regardless; the guard
only avoids rendering a screen that cannot load. The navbar shows Users only
to admins.

## What the screens found

**The settings first read was not safe under concurrency.** Settings are
created on first read (ADR-0007). In development, React's StrictMode
mounts, unmounts and remounts each component; the query wrapper hands the
fetch an `AbortSignal`, so the unmount aborts the request client-side, and
the remount sends another. The server still runs the aborted one. Two or
three first reads for the same account arrived together, each found no
row, each inserted, and the losers answered 500 on the primary key. The
controller now catches that `DbUpdateException` and returns the winner's
row. No contract changed, so `openapi.json` and `schema.d.ts` are
untouched. The 35 API tests still pass.

**Playwright's own request context does not send the `Secure` cookie over
plain http.** The browser on `127.0.0.1` does (ADR-0008). Registering
through `page.request` works because the cookie is stored into the shared
jar; reading the API afterwards through `page.request` does not, because it
is not sent back. Tests that need to read the API do so from inside the
page with `page.evaluate`.

**`Bootstrap:AdminEmail` cannot be an environment variable during `dotnet
run`.** The build-time OpenAPI generator (ADR-0007) builds the host with
the same environment and no database, and the bootstrap then fails the
build. The verification script passes it as a command-line argument, which
reaches only the running app. The bootstrap only promotes an account that
exists, so on a first run the script registers it and restarts the API
once.

## Rejected alternatives

- **TanStack Router.** Reconsidered as ADR-0008 asked. One parameterised
  route (`/rooms/:id`) does not justify the generation step.
- **A shared generic CRUD screen.** Tasks, events and rooms have different
  shapes, actions and rules; a generic component would carry every
  difference as a prop. Three short screens are easier to read than one
  configurable one.
- **Client-side paging for admin users.** The API already pages; fetching
  every user to page them again in the browser would be the wrong direction
  for the one table that can grow without bound.
- **Optimistic cache updates.** Invalidation costs one refetch per mutation
  and is never wrong about what the server holds. Nothing here is
  latency-sensitive enough to trade that away.

## Consequences

- A new screen is a folder with a `queries.ts` over the generated client;
  a hand-written `fetch` anywhere outside `src/api` fails the verification
  script.
- Every mutation must invalidate by path prefix or, like settings, write
  the response it was given. A mutation that does neither leaves a stale
  list, and no test will catch it until a screen depends on it.
- `scripts/verify-phase-5.sh` needs the local database migrated, Chromium,
  and either no API on 5180 or one started with the bootstrap argument it
  prints.
- The calendar grid ignores the settings time zone. Whoever applies it must
  also change how all-day events are stored, since local midnight would no
  longer be the browser's.
