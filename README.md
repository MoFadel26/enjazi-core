# Enjazi

A productivity web app. You keep your tasks and calendar in one place, join
rooms to work alongside other people, and build a streak by finishing
something every day.

## What it does

- **Tasks** — create, prioritise, set a due date, tick off. Overdue ones stand out.
- **Calendar** — a week grid you can drag events around in.
- **Rooms** — shared spaces with live chat. Anyone can see a room and join it.
- **Streaks** — finish a task each day to keep a run going and collect points.
- **Settings** — light or dark theme, time zone, notification preferences.
- **Admin panel** — search accounts, assign roles, disable users.

Everything is private to you unless it's in a room. That's enforced in the
database layer, not by checks scattered through the code.

## Built with

ASP.NET Core 10 and PostgreSQL on the back end. React 19, TypeScript and
Mantine on the front end, with types generated from the API so the two can't
drift apart.

## Running it

Needs .NET 10, Node 22+ and PostgreSQL 16+.

```sh
createdb enjazi_core
dotnet ef database update --project src/Enjazi.Api
dotnet run --project src/Enjazi.Api                # API

cd src/Enjazi.Web && npm install && npm run dev    # app
```

Then open `http://127.0.0.1:5182` and register an account.

## Digging deeper

`docs/plan.md` is what was built and in what order. `docs/adr/` holds the
decisions and the reasoning behind each one. `docs/design.md` is the visual
spec.
