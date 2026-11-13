# ADR-0021: Tasks on the calendar

**Status:** accepted
**Date:** 2026-11-13

## Context

The calendar showed events only. A task has a due date and time, so the
week had two halves on two screens: what is booked on the calendar, what is
due on the task list. The request was for the calendar to show tasks too,
with a setting that decides whether completed tasks are among them.

The mechanisms, stated before the decisions:

1. **FullCalendar draws whatever is in its `events` prop.** Each item is an
   `EventInput`; a new array replaces the old set, which is how the screen
   already showed the result of a save (ADR-0004). An input can carry
   `durationEditable`, an `allow` function that vetoes a drop target, a
   `className`, `color` and `contrastColor`, and an open `extendedProps`
   record. A timed event that crosses midnight is drawn once in each day's
   column.
2. **FullCalendar writes an event's colours on the element itself.**
   `color` and `contrastColor` become `--fc-event-color` and
   `--fc-event-contrast-color` in the chip's `style` attribute, which no
   stylesheet rule overrides. Without them the theme's defaults are written
   there.
3. **`eventContent` replaces a chip's inside** for the events it returns
   content for; returning `true` keeps the default.
4. **After a drop the grid has already moved the chip.** `eventDrop` gets
   the new and the old position, and `revert()` to undo the move. A new
   `events` array also puts every chip where the array says.
5. **Task writes are optimistic** (ADR-0012). `useTasks` draws each pending
   update over the cached list; a failed one stops being drawn and
   `useUpdateTask` shows a notification.
6. **EF Core reads a missing JSON key as the CLR type's default.** The
   settings row is one jsonb column mapped to `SettingsData` (ADR-0013).
   A row saved before a property existed has no key for it, and EF Core
   leaves the property at `default(T)`, not at the value the class
   initialises it to. For a `bool` that is `false`. ADR-0013 stated the
   opposite; a test written for this change failed on it.

## Decisions

### A task is a 30-minute chip from its due time

The chip starts at the due time and lasts 30 minutes, so it is as tall as
an event of that length and its title fits. A task has no length, so 30
minutes is a drawing choice and is not saved anywhere.

A chip may not cross midnight, or it would show again at the top of the
next day. A task due in the last half hour of its day is drawn as that half
hour: a task due at 23:59, the time a drag on the task list gives a task
with no time (ADR-0020), is the 23:30 chip. The chip's label is always the
due time, not the chip's start.

Rejected: *a chip cut at midnight*, so a task due at 23:59 is one minute
long. FullCalendar draws it at its minimum height, 15px, partly below the
last row, where it is hard to see and to grab. *Tasks in the all-day row.*
Offered and declined: the time is what places a task in a day.

### A drag moves the due time by as much as the chip moved

The new due time is the chip's new start plus how far the due time was
from the chip's old start. For almost every task that is the chip's new
start itself. For a chip drawn as the last half hour, it keeps the task's
minutes: a 23:59 task dragged to another day is due at 23:59 that day.
Dragged to 10:00 the same chip is due at 10:29 and redraws there, 29
minutes lower than where it was dropped.

The save goes through `useUpdateTask` with `{ dueAt }` only. It shows at
once and a failure takes the chip back with a notification. The handler
never calls `revert()`: the optimistic list is what places the chip, both
when the save is pending and when it fails, and calling `revert()` as well
would move the chip twice.

A chip cannot be resized, since a task has no length, and `allow` refuses
the all-day row, since a task has a time.

Rejected: *the due time is the chip's new start.* A 23:59 task dragged to
the same row of the next day would become due at 23:30.

### Clicking a chip opens the task's edit dialog on the calendar

`TaskFormModal` from the tasks screen, unchanged. The calendar reads the
same `useTasks` list as the task list, so a change made in either shows in
both without a refetch.

Rejected: *going to `/tasks?edit=<id>`.* It leaves the calendar for a
change that is about the calendar.

### Tasks and events read apart

Events are the filled accent. A task chip is the accent tint under ink
text, with a 2px bar of the accent text colour on its leading edge, the
same idiom as the command palette's selected action; a completed task is
dimmed with its title struck through, as in the task list. A box icon,
ticked when done, stands before the title, and visually hidden text says
"Task: " or "Completed task: ", so a screen reader can tell a task from an
event. The colours are passed per chip, because of mechanism 2.

Ids are prefixed `task:`, so a click and a drop know a task from an event,
whose id is a bare GUID.

### "Show completed tasks" is an account setting, on by default

`SettingsData.ShowCompletedTasksOnCalendar` beside the theme, the palette
and the time zone, in its own Settings section, Calendar. On by default:
seeing what was done that day is the point of showing tasks on a calendar.

The property is `bool?` and the API answers `null` as `true`. Because of
mechanism 6, a plain `bool` would read `false` for every account saved
before this change, and their completed tasks would vanish without anyone
choosing that. The response carries a plain `bool`.

The same thing would happen on the way in. `PUT` replaces the whole tree,
and a page loaded before the deploy sends it without this field, which
ASP.NET Core binds to a plain `bool` as `false`: saving the theme from an
old tab would hide completed tasks. So the request's field is optional, and
leaving it out keeps the saved value.

`SettingsTests` removes the key from a saved row with SQL and checks the API
answers `true`, and saves a tree without the field and checks the value
stayed.

Until the settings have loaded, the calendar draws no tasks, so a completed
task is never drawn and then removed.

Rejected: *a migration that writes the key into every row.* It works for
existing rows, but every later setting would need the same, and a row
written by an older build during a deploy would still lack it.
*Inverting the setting* to `HideCompletedTasksOnCalendar`, whose default is
`false`, which a missing key already reads as. It works, but the screen
would then show a negated value or a switch whose "on" hides things.
*A choice kept in the browser.* Lost on another device, and the existing
settings are all account settings.

## Consequences

- No migration. `dotnet ef migrations has-pending-model-changes` reports
  none; the model snapshot lists the new property only once a later
  migration is generated, as happened with `Palette`.
- `openapi.json` and `src/api/schema.d.ts` have the new field: optional
  and nullable in `SettingsRequest`, required in `SettingsResponse`. The
  app's two writers, the Settings form and the landing page's theme toggle,
  send it.
- ADR-0013's statement that a new property appears with its default for old
  rows is wrong for a value type. For `Palette`, a string, it was not
  checked here.
- `e2e/calendar-tasks.spec.ts` covers placement, the setting, the edit
  dialog, a drag, a 23:59 task dragged to another day, the all-day row
  refused, and a refused save. `SettingsTests` covers the default, saving
  both values, a row from before the setting, and a save without it.
