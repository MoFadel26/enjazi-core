# ADR-0010: Room chat over a push-only hub, and a streak with its own clock

**Status:** accepted
**Date:** 2026-09-24

## Context

Phase 6 is the two features the previous version advertised and never made
work: room chat and streaks. The `messages` and `streaks` tables have existed
since Phase 1 (ADR-0005); ADR-0007 deferred the messages query filter to
this phase. The plan's check is behavioural: two browser tabs see each
other's messages, and a completed day increments the streak while a missed
day resets it.

The mechanisms, stated before the decisions:

1. A SignalR connection is one long-lived HTTP request upgraded to a
   WebSocket. It is authenticated once, at the upgrade, with the same cookie
   the controllers read, because the hub is on the app's own origin behind
   the Vite proxy (ADR-0008). From then on the server can push to it, and
   `IHubContext.Clients.User(id)` reaches every connection that user has
   open, in any tab.
2. The connection is a delivery channel, not a source of truth. The browser
   holds one copy of a room's history, in the query cache under the same key
   the REST read uses; a pushed message is appended to that copy, and the
   screen renders the copy. A reload asks REST again and gets the same list.
3. A streak is a calendar question, so it is answered in the user's time
   zone from settings, with "today" read from an injected clock. The rule:
   a completion on the day after the last one extends the run; on the same
   day it adds points only; on any later day it starts a run of one. A run
   whose last day is neither today nor yesterday reads as zero before the
   next completion writes that down.

## Decisions

### Messages travel over REST; the hub only pushes

`GET` and `POST /api/rooms/{roomId}/messages` are ordinary controller
actions, so the message shape is in `openapi.json` and the generated client
types it like everything else. `RoomHub` has no methods. After a message is
saved, the controller sends it as `MessageReceived` to the users who are
members of the room at that moment, by user id.

There are no SignalR groups. A group is membership state held in the hub,
and it would have to be kept in step with `room_members` on every join,
leave and removal, with a removed member still in the group until they
reconnected. Sending to the current member list per message costs one query
and cannot drift. The client filters pushed messages by room, since its one
connection carries every room it is a member of.

Rejected: *hub methods for send and join.* They would put the message
contract outside the OpenAPI document, so the frontend would hand-write its
type, which the plan forbids; and they need the caller's id inside the hub,
which `ICurrentUser` reads from `IHttpContextAccessor` and which is not
reliably set during hub invocations.

### Messages get the membership query filter

`Message` is filtered by `m.Room.Members.Any(x => x.UserId ==
CurrentUserId)`. The filter reaches `Room` and `RoomMember`, both
unfiltered, so it does not recurse (ADR-0007). It scopes by membership, not
by author: a member reads everyone's messages in the room and nobody else
reads any. The controller checks membership explicitly on top, so a
non-member gets 404 rather than an empty list, and a removed member loses
the history at once; `MessageTests` covers both.

### The feed hook appends to the cache and refetches once on connect

`useRoomFeed` opens the connection while a room is on screen, appends each
pushed message for that room to the cached history, and drops duplicates by
id, so the sender's own POST response and the pushed copy do not both land.
Messages sent between the history request and the connection opening are
not pushed anywhere, so the hook refetches the history once the connection
starts, and again after each automatic reconnect. The chat test checks the
count on both sides after a message each way and after a reload.

In development, React StrictMode mounts the hook twice; the first
connection is stopped during negotiation and SignalR logs that as an error
in the console. It is that and nothing else; production mounts once.

### The streak is recorded on the open-to-completed transition only

`TasksController.Update` calls `StreakService.RecordCompletionAsync` when a
task that was open becomes completed, in the same `SaveChanges`. Saving an
already completed task and reopening one do not touch the streak; completing
a task, reopening it and completing it again counts twice, which is accepted
as not worth a completion log to prevent. Ten points per completion. A
missed day is not written anywhere when it happens; `GET /api/streak`
reports the run as zero and the next completion overwrites the row. There is
no endpoint to set the streak.

### The streak reads a keyed clock, not the app's `TimeProvider`

`StreakService` takes `TimeProvider` under the key `StreakClock.Key`, and
the test host replaces that key with a fake it can move by days. The first
attempt registered the fake as the plain `TimeProvider`. Cookie
authentication also resolves that type, so every cookie was issued as
expiring fourteen days after March 2026, and the test client's cookie jar,
which runs on real time, dropped them: forty failures reading `401`. A moved
clock belongs to the one component that asked for it.

Rejected: *`Microsoft.Extensions.TimeProvider.Testing`.* A dependency for a
class that overrides one method.

### The reset is proved in the API tests, the increment in both

A browser cannot skip a day, so `StreakTests` walks the fake clock through
two consecutive days, a gap, and a restart, asserting the whole response at
each step, and checks that 23:00 UTC is already tomorrow in Auckland.
`streak.spec.ts` completes a task in the browser and reads the dashboard.
`scripts/verify-phase-6.sh` runs the API tests first and the two browser
tests last, with the OpenAPI and client currency checks in between because
this phase added endpoints.

## Consequences

- `/hubs` is proxied with `ws: true` beside `/api`; a production host must
  forward WebSocket upgrades on that path too.
- A new room feature that pushes must send to the member list at that
  moment, as `MessagesController` does. Nothing else should introduce
  groups.
- `useUpdateTask` invalidates `/api/streak` as well as `/api/tasks`. Any
  other path that completes a task must do the same.
- The streak's day boundary follows the settings time zone. Changing the
  zone changes what "today" is, which can make a streak read as broken or
  as already completed; it does not rewrite past days.
- The history request is capped at the latest fifty messages and there is
  no paging. Older messages exist and are not reachable from the screen.
