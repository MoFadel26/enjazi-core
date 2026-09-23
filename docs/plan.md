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

## Phase 4 — frontend shell

Vite + React 19 + TypeScript, Mantine, TanStack Query, routing, auth flow, app
layout. API client generated from the OpenAPI document so request and response
types originate in the backend.

Verify: login, protected-route redirect and logout all work against the running
API; no `any` in the client.

## Phase 5 — screens

Dashboard, tasks, calendar, rooms, settings, admin.

Verify: every screen fully typed against the generated client, and no single
screen file over roughly 200 lines.

## Phase 6 — features that never worked

SignalR room chat; streak and points logic.

Verify: two browser tabs see each other's messages; a completed day increments
the streak and a missed day resets it.

## Out of scope

- **OAuth integrations.** The previous version declared five (Google, Slack,
  Notion, Todoist, GitHub). All five callback handlers were stubs that redirected
  with a success message without exchanging the code. Rebuilding them means real
  token encryption work for no portfolio value.
- **"Adaptive scheduling."** Advertised in the old README. No implementation
  ever existed.
