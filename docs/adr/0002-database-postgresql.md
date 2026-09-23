# ADR-0002: PostgreSQL over MongoDB

**Status:** accepted
**Date:** 2026-09-23

## Context

The previous version used MongoDB with Mongoose. The data it stored is
relational in shape:

- a task belongs to exactly one user
- a room has one creator and many members; a user belongs to many rooms
- a message belongs to one room and one author

Mongoose modelled these as arrays of ObjectIds on the parent document
(`user.tasks[]`, `user.rooms[]`, `room.enrolledUsers[]`). That produced concrete
problems:

- **No referential integrity.** Deleting a task required manually pulling its ID
  out of every user document. Deleting a user did not clean up anything. Orphans
  were inevitable.
- **Ownership was not enforceable.** Because the `Task` document had no owner
  field, "is this task yours?" could not be answered without loading the user
  and scanning an array — so the code simply skipped the check.
- **Unbounded embedded arrays.** Room chat messages were stored as an array
  inside the room document. Every message read loads the entire history, and the
  document grows toward MongoDB's 16 MB limit.
- **Duplicated, drifting sub-schemas.** `notificationSchema` imported
  `emailPrefSchema` and `browserPrefSchema`, ignored both, then redefined the
  same fields inline with different names (`taskReminder` vs `taskReminders`).
  Nothing catches that in a schemaless store.

## Decision

PostgreSQL 16+ accessed through EF Core.

## Why

- **Foreign keys make the ownership bug impossible.** `tasks.user_id` is
  `NOT NULL REFERENCES users(id)`. A task cannot exist unowned, and a cascade
  rule defines exactly what deletion does.
- **Join tables model membership correctly.** `room_members(room_id, user_id)`
  with a composite primary key replaces two arrays that had to be kept in sync
  by hand.
- **Messages become rows**, paginated and indexed by `(room_id, created_at)`,
  instead of an array that grows without limit.
- **Migrations are versioned files.** Schema drift is reviewable in a pull
  request rather than discovered at runtime.
- **The settings blob keeps its flexibility** where flexibility is genuinely
  useful: Postgres `jsonb` stores the settings tree with schema validation done
  in C# types, so the old duplicate-field drift can't recur.
- Leaderboard and streak features need aggregate queries — `SUM`, `RANK() OVER`,
  date-series joins. SQL does this natively.

## Alternatives considered

**Staying on MongoDB.** Every problem above is solvable with discipline:
denormalised owner fields, a separate `messages` collection, transactions. But
that means reimplementing what a relational database provides by default, and
the previous version demonstrates what happens when that discipline lapses.

**SQLite.** Fine for local development and tests, and EF Core makes swapping
providers cheap. Rejected as the primary store because the leaderboard work
wants window functions and concurrent writers.

## Consequences

- A migration must be written and reviewed for every schema change. This is the
  benefit, but it is also friction compared to Mongoose's implicit schema.
- No data is carried over from the old database. The rebuild starts empty.
