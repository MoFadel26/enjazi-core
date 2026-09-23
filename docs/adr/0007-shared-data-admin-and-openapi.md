# ADR-0007: Shared data, admin access, and the committed OpenAPI document

**Status:** accepted
**Date:** 2026-09-23

## Context

ADR-0006 settled how user-owned data is scoped: a global query filter on the
entity, no check in the controller. Phase 3 adds the rest of the API, and not
all of it is user-owned. Events and settings are; rooms are shared between
users; the admin endpoints exist to see across users. Phase 3 also has to
produce the OpenAPI document that Phase 4 generates its client from, which
fixes some wire-format decisions.

## Decisions

### Events and settings follow tasks

Both get an owner query filter identical to the one on tasks. `EventsController`
and `SettingsController` contain no ownership check. Settings are created on
first read rather than at registration, so an account that predates a new
setting still gets its default without a backfill.

### Rooms carry no query filter, and that is deliberate

A room is shared, and to join one you have to be able to see that it exists.
A membership filter on `Room` would make every room invisible to everyone
outside it, so nothing could be joined. Instead:

- `GET /api/rooms` and `GET /api/rooms/{id}` are visible to every signed-in
  user, returning name, description, member count and whether the caller is a
  member. Nothing private is in that shape.
- Membership gates the contents. `GET /api/rooms/{id}/members` returns 404 to
  a non-member, and for the same reason as everywhere else: a 403 would confirm
  what is behind the door.
- Room administration is gated by a `RoomMember` row with `RoomRole.Admin`,
  not by `rooms.owner_id`. The creator gets that row at creation. Reading the
  membership row rather than the owner column means administration can later
  be granted to someone else without pretending they created the room.

These are explicit predicates in `RoomsController` — `IsMemberAsync` and
`AdministeredRoomAsync` — which is what ADR-0006 argued against. The
difference is what is being decided. For tasks the question is *whose row is
this*, and a filter answers it once for every query. For rooms the question is
*what may this member do to this shared row*, which is authorization, differs
by endpoint, and has no single predicate a filter could carry. Both helpers
return null or false and every caller turns that into 404, so the failure mode
stays "not found" rather than "found and refused".

Rejected alternatives:

- *Membership filter on `Room`, join by id.* Structurally cleanest and makes
  discovery impossible; Phase 5's rooms screen would have nothing to list.
- *A public/private flag.* Closest to a real product and a migration for a
  feature the plan did not ask for. Cheap to add later if wanted; the
  `RoomResponse` shape would not change.
- *Owner column for administration.* Cannot be transferred without rewriting
  who created the room.

### `RoomMember` has no filter, and messages wait for Phase 6

EF Core applies query filters through navigations. `Room`'s would reach
`RoomMember`; a `RoomMember` filter reaching back to `Room` recurses and fails
at model build. So `RoomMember` is unfiltered and only ever read after the room
lookup, which is the check. Messages are chat, chat is Phase 6 with SignalR,
and their filter (membership of the message's room) lands with them.

### Admin endpoints

- One named policy, `Admin`, requiring the `Admin` role. Role claims are
  already in the cookie from Phase 2's `AddRoles<Role>()`.
- Three endpoints over users: list with search and paging, get, update. The
  `users` table is not user-scoped, so nothing here needs `IgnoreQueryFilters()`
  yet. The first admin read across a scoped table — rooms or tasks oversight —
  will, and should be the only place it appears.
- Disabling is Identity's lockout with no end date. ADR-0005 says prefer
  disabling to deleting, so there is no delete. `PasswordSignInAsync` refuses a
  locked-out account with no code of ours in the login path. A cookie issued
  before the lockout stays valid until it expires; ADR-0006 already accepts
  that trade and names the fix (a security stamp check) if it is ever needed.
- Roles are set wholesale in the same request, and an unknown role name is 400.
- An admin cannot modify their own account. Disabling yourself or dropping
  your own role locks the last admin out with no way back.

### The first admin comes from configuration

`Bootstrap:AdminEmail`, read by a hosted service at startup. If it is set and
that account exists, the `Admin` role is created if missing and the account is
put in it. If the setting is absent the service does nothing and never touches
the database, which matters in two places: the test host, which starts before
migrations run, and OpenAPI generation at build time, which builds the host
without a database at all. The same method is callable directly, which is how
the tests make an admin.

Rejected: a CLI argument (`dotnet run -- promote-admin`) adds command handling
to `Program.cs` that nothing else uses; a fixed development account with a
known password is one environment check away from existing in production.

### The OpenAPI document is generated at build time and committed

`Microsoft.Extensions.ApiDescription.Server` writes `openapi.json` to the
repository root on every build of the API. No running app or database is
needed. A changed endpoint therefore shows up as a diff to a committed file,
and `scripts/verify-phase-3.sh` fails if a rebuild changes it. The output is
byte-identical across rebuilds, which is what makes that check usable.

Three things had to be true for this to work, and they constrain future
changes:

- **Package patch versions must match.** The generator tool loads the app's
  `Microsoft.OpenApi` assembly and fails on a version mismatch. It happened
  with `Microsoft.AspNetCore.OpenApi` 10.0.11 against the tool at 10.0.12.
  Bump them together.
- **Enums are strings on the wire.** ADR-0005 stores them as integers; that is
  storage, and this is the API. Without a converter the document says
  `integer` with no values and the generated client types a priority as
  `number`. With `JsonStringEnumConverter` it lists `Low`, `Medium`, `High`
  and the client gets a union. Integers are still accepted on input. The
  converter is registered on both MVC's JSON options (what the controllers
  serialise with) and the Http JSON options (what the generator reads); either
  alone makes the document disagree with the wire.
- **Operation ids are derived.** MVC sets none, and client generators name
  functions after them. An operation transformer sets
  `{Controller}_{Action}`: `Tasks_Get`, `Auth_Login`.

No security scheme is declared. Cookie authentication is invisible to a
browser client and there is no third-party consumer to document it for.

## Consequences

- Rooms are the one area with explicit authorization predicates in a
  controller. Any new room endpoint must go through `IsMemberAsync` or
  `AdministeredRoomAsync`; there is no filter to catch a miss.
- `openapi.json` changes whenever a contract or route does, and that diff
  belongs in the same commit as the change.
- Adding an enum to any contract changes the wire format from what integer
  storage would suggest. The contract types, not the entities, define the API.
- The admin's first action on a fresh deployment is setting
  `Bootstrap:AdminEmail` and registering that address; nothing else creates an
  admin.
