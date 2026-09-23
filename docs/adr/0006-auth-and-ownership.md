# ADR-0006: Cookie auth, and ownership enforced by a query filter

**Status:** accepted
**Date:** 2026-09-23

## Context

The previous version of this application had one security bug that mattered:
`GET /api/tasks/:id` loaded the task by id and returned it. Any authenticated
user could read or modify any task by guessing or observing an id. The fix
there would have been a check in the controller, and the reason it was missing
is that a check in a controller is something a person has to remember to write,
once per endpoint, forever.

Phase 2 adds authentication and the first set of user-scoped endpoints, so it
is where that class of bug is either made impossible or reintroduced.

## Decisions

**Ownership is a global query filter on the entity, not a check in the
controller.** `AppDbContext` applies `HasQueryFilter(t => t.OwnerId ==
CurrentUserId)` to `TaskItem`. EF Core appends `where owner_id = @current` to
every LINQ query over `Tasks`, so `TasksController` contains no ownership check
at all and cannot omit one. The caller's id reaches the context through an
`ICurrentUser` service reading `IHttpContextAccessor`; it is a property on the
context rather than a captured value, because the model is built once and
cached and the filter has to become a query parameter that is evaluated per
query.

Rejected alternatives:

- *A check in each controller action.* This is exactly what the previous
  version did in four places and forgot in the fifth.
- *A base repository that every query goes through.* Correct as long as nobody
  uses the `DbSet` directly. The query filter has no such condition.
- *Postgres row-level security.* Enforcement one layer lower, which is
  genuinely stronger. It needs a database role and a `set_config` per request
  on a pooled connection, and it splits the ownership rule between the C# model
  and SQL that no migration generates. Reconsider if a second writer ever
  reaches this database.

**An unauthenticated context sees nothing, not everything.** `ICurrentUser.Id`
is `Guid.Empty` with no signed-in user, which matches no row. The failure mode
of a missing principal is an empty result rather than a full table.

**Another user's row is 404, not 403.** A 403 confirms the row exists, which
turns a guessed id into an oracle. The filter produces this for free: the row
is not found, so `NotFound()` is the only truthful answer.

**The owner is taken from the cookie on create and is not a field on any
request contract.** Query filters restrict reads; they do not restrict inserts.
`CreateTaskRequest` has no owner field, so the only way to set one is from the
principal.

**Only `TaskItem` has the filter today.** Phase 3 adds events, rooms, settings
and streaks along with their endpoints, and adds their filters at the same
time. Writing four filters now for entities with no endpoints would be code no
test exercises. The rule to apply is in the project conventions.

**Two deliberate escape hatches exist.** `IgnoreQueryFilters()` and raw SQL
both bypass the filter. Phase 3's admin endpoints need the first one; it should
appear only in code that is behind an authorization policy.

**Cookie authentication, not JWT bearer tokens.** The frontend and the API are
the same site (`127.0.0.1:5182` and `127.0.0.1:5180`; cookies ignore the port),
so an `HttpOnly` cookie is sent automatically, cannot be read by JavaScript,
and can be dropped server-side. A bearer token would have to be stored
somewhere reachable by script, and this application has no third-party API
consumers to justify that.

The cookie is named `enjazi_core_auth`. An unrelated older project on this
machine sets a cookie named `jwt` on `localhost`; sharing a name would make the
two applications log each other out.

**`AddIdentityCore` with an explicitly configured cookie scheme, not
`AddIdentity` and not `MapIdentityApi`.** `AddIdentity` registers cookie
schemes of its own, which would then have to be reconfigured rather than
configured. `MapIdentityApi` gives register, login, refresh, email confirmation
and two-factor endpoints in one line, most of which are dead here, with
response shapes fixed by the framework and an OpenAPI document that Phase 4
generates its client from. Four hand-written endpoints cost less than removing
the rest.

Two consequences of using Identity partially: `SignInManager.SignOutAsync`
signs out of the external and two-factor schemes as well, which are not
registered, so `AuthController` calls `HttpContext.SignOutAsync` with the
application scheme directly.

**Password policy is length, not composition.** Twelve characters minimum, no
required digit, case or symbol. Identity's defaults require all three at six
characters, which rejects a twelve-character passphrase and accepts `Pass1!`.
Lockout is on: five failed attempts, fifteen minutes.

**Roles are registered but none are seeded.** `AddRoles<Role>()` gives
`RoleManager` and puts role claims in the cookie. No role exists yet because
nothing checks one; Phase 3 seeds `Admin` alongside the policies that use it.

**Tests run against Postgres in a container, not SQLite in memory.** What is
being tested is what EF Core and Postgres enforce together, and a different
engine does not reproduce that. Testcontainers gives each run its own database
without depending on the developer's local Postgres. The cost is that the test
suite requires Docker.

## Consequences

- Reading tasks outside a request — a background job, a SignalR hub without a
  principal, a seeding routine — returns nothing until it is given a caller.
  This is intended, and will surface in Phase 6.
- Any future query that must cross users has to say `IgnoreQueryFilters()`,
  which makes those places greppable.
- `scripts/verify-phase-2.sh` requires Docker. `scripts/verify-phase-1.sh`
  still uses the local Postgres.
- Sessions cannot be revoked server-side. The cookie is valid until it expires
  (fourteen days, sliding) or the data protection key changes. Revocation, if
  it is ever needed, means a security stamp check on each request.
