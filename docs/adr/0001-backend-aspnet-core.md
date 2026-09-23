# ADR-0001: ASP.NET Core for the API

**Status:** accepted
**Date:** 2026-09-23

## Context

The previous version ran on Node 20 + Express 4 + Mongoose. It is being replaced
because of defects that were structural rather than incidental:

- Task update and delete verified the caller's JWT but never checked that the
  caller owned the task. Any authenticated user could modify any task by ID.
  The `Task` document had no owner field at all; ownership existed only as an
  array of IDs on the user document, which no write path consulted.
- Authentication was implemented twice: a `protectRoute` middleware, plus
  hand-rolled token parsing inside individual controllers.
- No validation layer, no central error handling, no migrations, no tests.

The candidates for the rebuild were ASP.NET Core and Go.

## Decision

ASP.NET Core 10.

## Why

The failure above is an ownership-modelling failure, not a language failure. The
framework that best prevents it is the one with a real ORM and a real schema:
EF Core global query filters let ownership be applied once, at the data layer,
so a forgotten check in a controller cannot expose another user's data.

Beyond that, the app needs auth with roles, password reset, a permissions model,
and live room chat. ASP.NET Core ships all of it:

- **ASP.NET Identity** — password hashing, lockout, roles, token generation.
- **Authorization policies** — the admin permission matrix maps directly onto
  policy handlers, replacing the two competing admin middlewares in the old code.
- **SignalR** — room chat, which the old version never had despite the feature
  being advertised.
- **EF Core migrations** — schema changes become reviewable, versioned files.
- **Built-in DI, model validation and OpenAPI** — no assembly required.

## Alternatives considered

**Go.** Produces a small static binary, has a simpler concurrency story, and
less framework magic to reason about. Rejected because every item in the list
above would be hand-written or assembled from third-party libraries. There is no
performance or deployment requirement here that Go would satisfy and .NET would
not. Learning Go was explicitly not a goal; deepening ASP.NET Core experience was.

**Keeping Node/Express.** Rejected. The problems were architectural, and a
rewrite in the same stack would carry over the habits that produced them.

## Consequences

- Heavier runtime and a larger deployment artifact than a Go binary. Acceptable.
- More framework conventions to learn, which is the point.
- Hosting must support .NET. Rules out the previous Vercel setup for the API.
