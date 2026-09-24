# Build plan

Each phase has a verification step. A phase is not done until its check passes.

Two standing rules:

- **Explanation before implementation.** Each phase opens with a walkthrough of
  the mechanism being used — the auth flow, EF Core change tracking, how
  migrations are generated and applied, the SignalR connection lifecycle —
  before code is written against it.
- **Decisions get an ADR.** Anything that would be hard to reverse, or that
  someone could reasonably question, goes in `docs/adr/` with the rejected
  alternatives and why.

## Phase 0 — decisions and spikes

- [x] ADR-0001 backend, ADR-0002 database, ADR-0003 UI library
- [x] Spike the calendar week view in FullCalendar and Schedule-X
- [x] Close ADR-0004 with the outcome — FullCalendar

Verify: both spikes render draggable events from mock data; ADR-0004 decided.

Done. Both spikes render the twelve mock events. Only FullCalendar drags: on the
current published packages `@schedule-x/drag-and-drop` is a major version behind
the calendar it plugs into and throws on the first drag. That decided ADR-0004.

The spikes themselves stay on the `phase-0-scheduler-spike` branch rather than
on `main`. They were built to answer a question, the answer is in the ADR, and
no later phase builds on them. `spikes/verify.mjs` on that branch re-runs the
checks.

## Phase 1 — data model

Postgres schema through EF Core: users, tasks, events, rooms, room_members,
messages, settings, streaks. Foreign keys and owner columns on everything
user-scoped.

Verify: migration applies to a clean database; inserting a task with no owner
is rejected by the database, not by application code.

Done. `scripts/verify-phase-1.sh` creates a throwaway database, applies the
migration and confirms both an unowned task and a task with a non-existent
owner are rejected by Postgres. Conventions are in ADR-0005.

## Phase 2 — auth and tasks

ASP.NET Identity, roles, cookie auth. Tasks CRUD scoped to the caller through an
EF Core global query filter.

Verify: an integration test where user A receives 404 fetching user B's task.
This test is the proof that the previous version's ownership bug is structurally
impossible, not merely unwritten.

Done. `scripts/verify-phase-2.sh` runs eleven integration tests against a
Postgres container. `TasksController` contains no ownership check; the global
query filter in `AppDbContext` means user B's task is never returned to it, so
user A gets 404 on read, update and delete alike. ADR-0006 records the auth and
ownership decisions.

The tests run through the test project directly rather than `dotnet test`. The
.NET 10 SDK dropped VSTest and its replacement reports "Zero tests ran" for a
xunit.v3 project, which reproduces on an empty project.

## Phase 3 — remaining API

Events, rooms and membership, settings, admin endpoints behind authorization
policies.

Verify: a test per endpoint; OpenAPI document generated and committed.

Done. Twenty-seven operations across auth, tasks, events, rooms and membership,
settings and admin users; thirty-five integration tests cover every one of
them. `openapi.json` at the repository root is regenerated on every build and
is byte-identical across rebuilds, which `scripts/verify-phase-3.sh` checks
after running the tests. Room chat messages are deferred to Phase 6 with
SignalR. ADR-0007 records why rooms are the one area with explicit
authorization predicates, how the first admin is made, and the wire-format
decisions the document fixed.

## Phase 4 — frontend shell

Vite + React 19 + TypeScript, Mantine, TanStack Query, routing, auth flow, app
layout. API client generated from the OpenAPI document so request and response
types originate in the backend.

Verify: login, protected-route redirect and logout all work against the running
API; no `any` in the client.

Done. `src/Enjazi.Web` is the Vite project; `scripts/verify-phase-4.sh` checks
that the generated client matches `openapi.json`, typechecks, lints with
`no-explicit-any` as an error, builds, and then runs four Playwright tests in
Chromium against the real API: redirect to login, register and return, logout
and re-check, and a cookie dropped behind the app's back. The dev server
proxies `/api` so the browser sees one origin and the cookie is first-party.
ADR-0008 records that, the client generator, and why the signed-in user lives
in the query cache.

## Phase 5 — screens

Dashboard, tasks, calendar, rooms, settings, admin.

Verify: every screen fully typed against the generated client, and no single
screen file over roughly 200 lines.

Done. Six screens, each a folder with its hooks over the generated client, a
screen and its modals; the longest file is 113 lines and
`scripts/verify-phase-5.sh` fails on any source file over 200 or any `fetch`
outside `src/api`. It then runs ten browser tests against the real API,
starting it with the bootstrap admin so the admin screen is tested as an
admin. Two things came out of the phase besides screens: the settings
first-read race in the API, fixed in the controller with no contract change,
and the fetch middleware giving bodiless failures a body so a 404 fails
instead of rendering empty. ADR-0009 records the decisions and both findings.

## Phase 6 — features that never worked

SignalR room chat; streak and points logic.

Verify: two browser tabs see each other's messages; a completed day increments
the streak and a missed day resets it.

Done. Messages are REST endpoints with the membership query filter ADR-0007
deferred here; a method-less SignalR hub pushes each saved message to the
users who are members at that moment, and the browser appends it to the
cached history it also renders. The streak is recorded when a task goes from
open to completed, in the user's time zone, from a clock keyed to the streak
alone. `scripts/verify-phase-6.sh` runs the 42 API tests, of which
`StreakTests` walks a fake clock through consecutive and missed days, checks
the OpenAPI document and generated client are current, and runs two browser
tests: two tabs chatting, and a completed task showing on the dashboard.
ADR-0010 records the decisions and the clock mistake made on the way.

## Phase 7 — design system

A published design system applied to the whole frontend instead of Mantine's
defaults: Linear for the dark scheme, the surface ladder, the single accent
and the type; Cal.com for the light scheme. Both are reduced to one Mantine
theme in `src/theme/`, a handful of shared pieces in `src/ui/`, and a
sidebar shell; every screen is restyled against it. `docs/design.md` is the
resolved spec.

Verify: no colour or type value anywhere but the theme; every screen paints
on the right canvas in both schemes without a page error; the whole browser
suite from Phases 4 to 6 still passes unchanged.

Done. `src/theme/` is the whole design system: a ten-shade lavender, the
two neutral ladders ordered so Mantine's fixed indexes land on the right
token, Inter self-hosted, and one `components` map; five `--enjazi-*`
variables carry the surfaces that Mantine 9 otherwise paints with the
canvas. `src/ui/` holds five shared pieces; the sidebar shell replaces the
header; every screen is restyled and the tests from Phases 4 to 6 pass
without a selector changed, because icon-only buttons keep their names
through `aria-label`. `scripts/verify-phase-7.sh` fails on a hex colour or
a pixel font size outside the theme, then runs the Phase 5 script, whose
suite now has a fourteenth test that sets each scheme through the account
and checks every screen paints on that scheme's canvas in Inter. The
longest source file is 131 lines. Two things the phase found are in
ADR-0011: the calendar drag test failing on a height formula that had lost
its parentheses, and `Group` dropping a streak of zero.

## Out of scope

- **OAuth integrations.** The previous version declared five (Google, Slack,
  Notion, Todoist, GitHub). All five callback handlers were stubs that redirected
  with a success message without exchanging the code. Rebuilding them means real
  token encryption work for no portfolio value.
- **"Adaptive scheduling."** Advertised in the old README. No implementation
  ever existed.
