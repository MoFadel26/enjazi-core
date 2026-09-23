# ADR-0005: Schema conventions

**Status:** accepted
**Date:** 2026-09-23

## Context

Phase 1 creates the first migration. Everything in it is cheap to change today
and expensive to change once rows exist, so the conventions are recorded here.

## Decisions

**The `users` table is ASP.NET Identity's user table from the start.** `User`
extends `IdentityUser<Guid>` and the context extends `IdentityDbContext`. Phase 1
does not configure Identity services; it only makes sure the table Phase 2 will
need already exists with the right shape. The alternative, a plain `users` table
now and a migration in Phase 2 that drops and recreates it as Identity's, would
be churn with no benefit.

**Identity's tables are renamed** (`users`, `roles`, `user_roles`, `user_claims`,
`user_logins`, `user_tokens`, `role_claims`) so the schema reads as this
application's, not the framework's. Identity's three named indexes
(`UserNameIndex`, `EmailIndex`, `RoleNameIndex`) keep their names; renaming
them buys nothing.

**snake_case everywhere**, applied by `EFCore.NamingConventions` rather than by
hand. Postgres folds unquoted identifiers to lower case, so PascalCase names
would need quoting in every ad-hoc query.

**`uuid` primary keys, generated client-side by EF Core.** Integer keys leak
row counts and are guessable. Ordering and uniqueness across environments is
not a concern at this scale.

**`timestamptz` for every instant, `date` for calendar days.** C# `DateTimeOffset`
maps to `timestamptz`; `DateOnly` maps to `date`. The streak's
`last_completed_on` is a `date` because "did the user complete something
today" is a calendar question, not an instant.

**Every user-scoped table has a non-null owner foreign key with
`ON DELETE CASCADE`.** Deleting a user deletes their tasks, events, settings,
streak, room memberships, messages, and the rooms they created (which cascades
to those rooms' members and messages). Rejected alternatives:

- *Set null on messages.* Keeps chat history readable after an author leaves,
  but violates the non-null owner rule this rebuild exists to enforce.
- *Restrict.* Makes user deletion a multi-step operation that application code
  must orchestrate, which is the pattern that produced orphans last time.

**Settings are one `jsonb` column** (`settings.data`) mapped as an EF Core
complex type. The shape is enforced by the C# type, so the previous version's
duplicated and drifting notification sub-schemas cannot recur. Individual
settings are never queried or indexed, so columns would add migrations for no
query benefit.

**Enums are stored as integers**, EF Core's default. Native Postgres enums
require a migration for every new value; strings cost more storage for no
query benefit.

**Indexes match query shapes, not just foreign keys.** `messages(room_id,
created_at)` for "latest N in this room", `tasks(owner_id, due_at)` and
`events(owner_id, starts_at)` for a user's upcoming items. EF Core creates a
plain index on every other foreign key.

## Consequences

- `dotnet ef migrations add` must be run for every model change and the output
  reviewed before commit.
- The settings tree can only be changed through C#; there is no SQL-level
  guarantee of its shape.
- Deleting a user is irreversible and wide. Phase 3's admin endpoints should
  prefer disabling accounts.
