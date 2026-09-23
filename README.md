# Enjazi Core

A productivity platform: tasks, calendar, collaborative rooms, streaks and an admin panel.

This is a ground-up rebuild. It shares a name and a problem domain with an
earlier Node/Express/MongoDB version, but no code and no git history.

## Status

Phase 2 — auth and tasks. The API has cookie authentication and tasks CRUD.
Everything else in `docs/plan.md` is still unbuilt.

| Endpoint | |
|---|---|
| `POST /api/auth/register` | creates an account and signs it in |
| `POST /api/auth/login` | |
| `POST /api/auth/logout` | |
| `GET /api/auth/me` | the signed-in user |
| `GET /api/tasks` | the caller's tasks |
| `GET /api/tasks/{id}` | 404 for anyone else's |
| `POST /api/tasks` | |
| `PUT /api/tasks/{id}` | |
| `DELETE /api/tasks/{id}` | |

Ownership is enforced by a global query filter in `AppDbContext`, not by any
check in `TasksController`. [ADR-0006](docs/adr/0006-auth-and-ownership.md)
explains why, and `tests/Enjazi.Api.Tests/TaskOwnershipTests.cs` is the proof.

## Running locally

```sh
createdb enjazi_core
dotnet ef database update --project src/Enjazi.Api
dotnet run --project src/Enjazi.Api        # http://127.0.0.1:5180
scripts/verify-phase-1.sh                  # schema check on a throwaway database
scripts/verify-phase-2.sh                  # integration tests, needs Docker
```

The tests bring up their own Postgres container and never touch the local
database. They run the test project directly rather than through `dotnet test`,
which the .NET 10 SDK cannot run a xunit.v3 project with; `verify-phase-2.sh`
has the detail.

The development connection string in `appsettings.Development.json` uses the
local Postgres.app defaults (no password, OS username).

This README describes only what exists. Planned work lives in `docs/plan.md`;
decisions and their reasoning live in `docs/adr/`.

## Intended stack

| Layer | Choice | Decision record |
|---|---|---|
| API | ASP.NET Core 10 | [ADR-0001](docs/adr/0001-backend-aspnet-core.md) |
| Database | PostgreSQL + EF Core | [ADR-0002](docs/adr/0002-database-postgresql.md) |
| Frontend | React 19 + Vite + TypeScript | [ADR-0003](docs/adr/0003-ui-mantine.md) |
| Components | Mantine 9 | [ADR-0003](docs/adr/0003-ui-mantine.md) |
| Admin tables | mantine-datatable 9 | [ADR-0003](docs/adr/0003-ui-mantine.md) |
| Scheduler | FullCalendar 7 | [ADR-0004](docs/adr/0004-scheduler-library.md) |
| Schema | snake_case, uuid keys, cascade owners | [ADR-0005](docs/adr/0005-schema-conventions.md) |
| Auth | Identity, cookie, query-filter ownership | [ADR-0006](docs/adr/0006-auth-and-ownership.md) |

## Local requirements

- .NET SDK 10
- Node 22+
- PostgreSQL 16+
- Docker, for the integration tests only
