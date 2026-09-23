# Enjazi Core

A productivity platform: tasks, calendar, collaborative rooms, streaks and an admin panel.

This is a ground-up rebuild. It shares a name and a problem domain with an
earlier Node/Express/MongoDB version, but no code and no git history.

## Status

Phase 1 — data model. The API project exists with the EF Core schema and its
first migration. No endpoints yet.

## Running locally

```sh
createdb enjazi_core
dotnet ef database update --project src/Enjazi.Api
dotnet run --project src/Enjazi.Api        # http://127.0.0.1:5180
scripts/verify-phase-1.sh                  # schema check on a throwaway database
```

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

## Local requirements

- .NET SDK 10
- Node 22+
- PostgreSQL 16+
