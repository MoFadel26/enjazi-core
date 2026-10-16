# Enjazi

A productivity web app: tasks, a week calendar, shared rooms with live chat,
and a daily streak that earns points.

- **Live app:** https://enjazi-core.wittyhill-0617d6ff.centralindia.azurecontainerapps.io

## What it does

- **Tasks** — create, prioritise, set a due date, tick off.
- **Calendar** — a week grid; drag events to move them.
- **Rooms** — shared spaces with live chat.
- **Streak and points** — finish a task each day to keep the streak and earn points.
- **Guest mode** — try it with sample data and no account; guest data is kept for 7 days.
- **Settings** — theme, palette, time zone, notifications, delete account.
- **Admin panel** — search accounts, assign roles, disable users.

## Built with

ASP.NET Core 10, PostgreSQL, React 19, TypeScript, Mantine. Sign-in by Clerk.

## Quick start

Needs .NET 10, Node 22+, PostgreSQL 16+ and a Clerk application. The
one-time Clerk and secrets setup is in [docs/development.md](docs/development.md).

```sh
createdb enjazi_core
dotnet ef database update --project src/Enjazi.Api
dotnet run --project src/Enjazi.Api                # API on 5180

cd src/Enjazi.Web && npm install && npm run dev    # app on 5182
```

Open http://127.0.0.1:5182.
