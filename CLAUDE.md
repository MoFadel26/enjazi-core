# enjazi-core

Ground-up rebuild of a productivity platform: tasks, calendar, collaborative
rooms, streaks, admin panel.

Read `docs/plan.md` for the phases and `docs/adr/` for why each decision was
made. Those files are the source of truth, not any chat history.

## Stack

- API: ASP.NET Core 10, PostgreSQL, EF Core
- Frontend: React 19, Vite, TypeScript, Mantine 9
- Admin tables: mantine-datatable. Scheduler: see ADR-0004.
- Auth: Clerk for sign-in, local users table for ids and roles. See ADR-0015.
- Do not add Tailwind or shadcn/ui. ADR-0003 explains why.
- `mantine-react-table` is unmaintained. Do not use it.

## Fixed local ports

Pinned deliberately, never defaults. See "Why these ports" below.

| Service | Port |
|---|---|
| API HTTP | 5180 |
| API HTTPS | 5181 |
| Frontend | 5182 |

Set `strictPort: true` in Vite so a taken port fails loudly instead of moving.

### Why these ports

- macOS Control Center holds 5000 and 7000, which are ASP.NET Core's defaults.
- 5173, Vite's default, is used by another project on this machine.
- An older, unrelated project uses 3000 and 5001.

## Cookie isolation

Serve the frontend on `127.0.0.1:5182`, not `localhost:5182`.

Cookies are scoped by hostname and ignore the port. Clerk keeps its session in
cookies on the app's hostname (`__session`, `__client_uat`, and `__clerk_db_jwt`
for a development instance). An older project on this machine sets a cookie
named `jwt` on `localhost`, and any other Clerk app on `localhost` uses the same
cookie names as this one. Sharing a hostname causes silent logouts that look like
bugs in this codebase. ADR-0015.

## Conventions

- Ownership is enforced at the data layer with EF Core global query filters,
  never by a check inside a controller. The previous version was breached
  exactly there.
- Every user-scoped table has a non-null owner foreign key.
- Screen components stay under roughly 200 lines. Split data fetching, state and
  layout apart.
- No `any` in TypeScript. API types are generated from the OpenAPI document.
- Explain the mechanism before implementing against it.
- Anything hard to reverse gets an ADR, including the rejected alternatives.

## Related but separate

An earlier version of this project lives at `../Enjazi` and on a shared repo.
It shares no code, no history and no database with this one. Never read from or
write to it.
