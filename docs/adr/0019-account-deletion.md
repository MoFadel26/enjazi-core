# ADR-0019: Deleting your own account

**Status:** accepted
**Date:** 2026-10-16

## Context

Settings had no way to delete an account. An account is two records: the
Clerk user, which signs in (ADR-0015), and the local `users` row, which owns
tasks, events, settings, the streak, rooms, room memberships and messages.
Rooms and messages are shared with other people, so what happens to them is
a decision about other users' data, not only the leaver's.

The mechanisms, stated before the decisions:

1. **Every reference to a user cascades.** One `DELETE` on `users` removes
   everything that points at the row (ADR-0005). That is how expired guests
   go (ADR-0017), and before this change it took a user's rooms, with every
   other member's messages in them, and the user's messages in other
   people's rooms.
2. **Only Clerk's Backend API deletes a Clerk user.** `DELETE
   /v1/users/{id}` on `api.clerk.com`, signed with the instance's secret
   key. Deleting the user also ends their sessions. The API held no secret
   key before this; it only checked session tokens against the instance's
   public keys.
3. **A Clerk user without a local row gets a new, empty one.** The first
   request from a Clerk user creates its row (`ClerkUserProvisioner`), so
   deleting only the local row leaves a working sign-in to an empty account.

## Decisions

### `DELETE /api/auth/me`, and the API deletes the Clerk user

The API deletes the Clerk user with `Clerk:SecretKey`, inside the same
database transaction as the local deletion and as its last step. If Clerk
refuses or is down, the transaction rolls back and nothing is deleted
(502). Without the key the endpoint answers 503 for a Clerk account. The
secret stays on the server; `infra/deploy.sh` passes it as a Container Apps
secret, like the guest signing key.

The one failure left: Clerk deletes its user and the commit then fails.
The local row stays with nobody able to sign in to it. Nothing reads it
except the admin list, and an admin can see it there.

### Rooms pass to the member who joined earliest

A room the leaver created goes to the remaining member with the earliest
`joined_at`, who becomes a room admin and the room's owner. A room with no
one else in it is deleted. Other people keep their rooms and their
messages.

### Messages stay, from "Deleted user"

`messages.author_id` becomes nullable with `ON DELETE SET NULL`. The API
returns `authorId` and `authorName` as null and the chat shows "Deleted
user". This breaks the rule that every user-scoped table has a non-null
owner key (ADR-0005) on purpose: a message is owned by its room, and the
author is who wrote it, not who owns it. Room membership, not authorship,
decides who can read it.

A guest's messages still go with the guest, on expiry and when the guest
deletes its account, as ADR-0017 decided: `GuestCleanup` and
`AccountDeletion` delete them before the user row.

### The last admin is refused

If the caller holds the Admin role and nobody else does, the API answers
409 and deletes nothing. The Settings card shows the reason: make someone
else an admin in Users first. Without this the admin panel would have
nobody until `Bootstrap:AdminEmail` signed up again and the app restarted.

### Confirmed by holding the button for 2 seconds

The Settings card's `Delete account` runs only after being held for 2
seconds, by pointer or by Space or Enter. Letting go early cancels. A typed
confirmation was the other option; the hold was chosen as quicker to do on
purpose and hard to do by accident.

## Rejected alternatives

- **Deleting the Clerk user from the browser** (`user.delete()`). Needs no
  secret on the server, but the two deletions are separate requests: if the
  second fails, the person signs in again to an empty account.
- **Deleting owned rooms for everyone.** The existing cascade and the least
  code, but it deletes other members' messages without their say.
- **Deleting the leaver's messages.** Also the existing cascade, but it
  removes one side of other people's conversations.
- **Letting the last admin go and relying on `Bootstrap:AdminEmail`.** It
  needs that address to sign up again and a restart, with no admin panel in
  between.

## Consequences

- One migration, `DeletedMessageAuthors`. Its `Down` deletes authorless
  messages, since the column becomes `NOT NULL` again.
- `MessageResponse.authorId` and `authorName` are nullable in the OpenAPI
  document and the generated types.
- Holding is harder for some assistive technology than a click: a screen
  reader's virtual cursor sends one click, not a held key. Space or Enter
  held on the focused button works.
