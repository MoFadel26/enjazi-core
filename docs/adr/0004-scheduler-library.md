# ADR-0004: Event scheduler library

**Status:** accepted
**Date:** 2026-09-23

## Context

The calendar screen needs a week and day view with events positioned by time and
draggable between slots. Neither Mantine nor shadcn/ui provides this;
`@mantine/dates` offers a date-picker calendar, which is a different component.

The previous version hand-built this. The result was `CalendarPage.jsx` at 895
lines, including its own `startofWeek` and `addDays` helpers alongside
`date-fns`, and a `console.log(typeof(end))` left in the render path.

## Options

**FullCalendar 7.1.0** — last published September 2026. The most capable and
most battle-tested option. Its core is framework-agnostic with a React wrapper,
so it does not feel native to React. Some views and features are under a
commercial licence; the premium bundle requires a paid key for production use.

**Schedule-X 4.1.0** — last published January 2026. MIT throughout, lighter,
designed more recently. Smaller ecosystem and less proven at edge cases
(recurring events, timezone handling, dense overlapping events).

## Decision criteria

Build the same week view in both. Compare on:

1. Lines of application code needed to render events from the API shape.
2. Drag-to-reschedule: does it emit a clean event with the new start and end?
3. Whether the default styling can be driven from Mantine's CSS variables.
4. Licence terms for every view actually used.
5. Bundle size added.

## Decision

**FullCalendar**, through the `@fullcalendar/react` package.

Criterion 2 decided it on its own. On the latest published versions, Schedule-X
cannot drag an event at all, and drag-to-reschedule is the reason the calendar
needs a library rather than a table of rows.

Both spikes live on the `phase-0-scheduler-spike` branch, under `spikes/`.
They are deliberately not merged: they are the evidence for this decision, not
part of the build, and nothing from Phase 1 onward imports from them. Running
`spikes/verify.mjs` on that branch reproduces every claim below.

### Version note

Both version numbers in the Options section above were wrong, because each
project spreads itself over packages that are released independently.
"FullCalendar 7.1.0" is `@fullcalendar/react`; its view plugins report 6.1.21 as
latest, which looks like abandonment but is the opposite (see below).
"Schedule-X 4.1.0" is `@schedule-x/react`, last published January 2026; the
calendar itself is `@schedule-x/calendar` 4.8.0, published September 2026. The
spikes used `@fullcalendar/react` 7.1.0 and `@schedule-x/calendar` 4.8.0.

### 1. Lines of application code — FullCalendar, 119 vs 153

Counting only the files that differ between the two spikes — the adapter, the
calendar component and the Mantine CSS bridge — and excluding blank lines and
comments:

| | FullCalendar | Schedule-X |
|---|---|---|
| `adapter.ts` | 21 | 34 |
| `WeekCalendar.tsx` | 48 | 71 |
| `mantine-bridge.css` | 38 | 35 |
| `main.tsx` | 12 | 13 |
| **Total** | **119** | **153** |

The gap is date handling. FullCalendar parses the ISO-8601 strings that
ASP.NET Core serialises, so the adapter assigns `startsAtUtc` straight across and
converts back with `toISOString()`. Schedule-X 4 takes `Temporal.ZonedDateTime`
or `Temporal.PlainDate` and hands the same union back on the way out, so the
adapter converts in both directions and re-narrows the union each time. All-day
events cost more again: Schedule-X wants an inclusive `PlainDate` end where the
API sends an exclusive one.

Neither library's event type is a safety net. `EventInput` ends in
`[extendedProp: string]: any` and `CalendarEventExternal` in `[key: string]: any`,
so a misspelled field compiles in both and silently becomes custom data. Under
the project's no-`any` rule the adapter has to be the typed boundary either way.

### 2. Drag-to-reschedule — FullCalendar; Schedule-X does not work

FullCalendar's `eventDrop` and `eventResize` both hand over an `EventImpl` with
`start` and `end` as `Date`, so the PATCH body is two `toISOString()` calls, and
`info.revert()` puts the event back when the server rejects the move. Observed:

```
PATCH {"id":"e2","startsAtUtc":"2026-09-22T12:00:00.000Z","endsAtUtc":"2026-09-22T14:30:00.000Z"}
  ok — kept
PATCH {"id":"e2","startsAtUtc":"2026-09-21T14:00:00.000Z","endsAtUtc":"2026-09-21T18:15:00.000Z"}
  PATCH /api/events/e2 failed (409) — reverted
```

Schedule-X throws on the first drag:

```
$app.config.plugins.dragAndDrop.startTimeGridDrag is not a function
```

`@schedule-x/calendar` 4.8.0 calls `plugins.dragAndDrop.startTimeGridDrag()`.
The newest published `@schedule-x/drag-and-drop` is 3.7.3, from January 2026,
and only has the v3 name `createTimeGridDragHandler()`. There is no 4.x release
on any dist-tag. Aliasing the three renamed methods onto the plugin object makes
dragging work and produces a correct PATCH body, which shows the break is the
rename alone — but that means monkey-patching a library's internals in an app
whose entire point is that the rebuild is structurally sound. The failed drag
also leaves a ghost copy of the event stuck over the grid.

Schedule-X's own reschedule hook is the better of the two designs:
`onBeforeEventUpdateAsync` is awaited and a `false` return reverts the move, so
persistence is a precondition of the update rather than a correction after it.
It does not compensate for the feature not running.

`@schedule-x/resize` 3.7.3 is on the same old major but happens to still match
the method names the calendar expects, so resizing does work — when tested on
its own. After a drag attempt the ghost copy covers the resize handle and it
cannot be reached.

TypeScript catches none of this: the plugins argument is typed
`PluginBase<string>[]`, which constrains only `name`.

### 3. Theming from Mantine variables — both work

Both expose a colour token layer that Mantine's variables can be poured into,
and both follow Mantine's dark-mode switch afterwards.

FullCalendar 7 keeps its palette in a separate `palette.css` (about 20 custom
properties), so the bridge replaces that import outright instead of fighting
overrides, and per-event colour comes from a `className` on the event plus one
CSS rule per category. Two tokens are tints laid over the grid rather than
fills; Mantine's `*-light` variables are opaque in dark mode, so those two need
an explicit `color-mix` alpha instead of a direct mapping.

Schedule-X uses Material-3 token names (`--sx-color-surface-container-high` and
so on), which take longer to map onto Mantine's semantic names, and three
elements carry literal hex in the shipped theme and need rules of their own.
Category colour is JS config rather than CSS, but Schedule-X injects those
strings into custom properties, so Mantine variables pass straight through.
Its `isDark` flag is read once at construction and needs `setTheme()` pushed in
through the imperative API on every colour-scheme change.

Two smaller differences, neither decisive. Schedule-X defaults its display
timezone to UTC and converts every event into it, so it needs an explicit
`timezone` where FullCalendar defaults to the browser zone. FullCalendar 7
hashes all of its own class names, so its internals cannot be targeted from CSS
or from a test — only the tokens and the classes you supply yourself are stable.

### 4. Licence — both MIT for the views needed

Every package the FullCalendar spike installs is MIT: `@fullcalendar/react`,
`@fullcalendar/core` and `@full-ui/headless-calendar`. The premium packages are
separate installs under a commercial licence — `premium-common`, `resource*`,
`scrollgrid` and the timeline views — and `timeGridWeek`, `timeGridDay` and
`interaction` are not among them. The concern recorded in the original Options
section does not apply to this project's views, and no key is needed.

Schedule-X is MIT too. `@schedule-x/resize` omits the `license` field from its
manifest but ships an MIT `LICENSE` file.

### 5. Bundle size — a wash, about 4 kB apart

Production build, gzipped, with each library split into its own chunk:

| | FullCalendar | Schedule-X |
|---|---|---|
| Library JS | 74.90 kB | 43.93 kB |
| Preact + signals | — | 10.86 kB |
| `temporal-polyfill` | 6.58 kB | 21.03 kB |
| CSS | 3.46 kB | 5.22 kB |
| **Total** | **84.94 kB** | **81.04 kB** |

Schedule-X's own code is far lighter, and then it spends the difference twice
over: it renders with Preact inside a React app, so both runtimes ship, and it
pins `temporal-polyfill` 0.3.0, which tree-shakes much worse than the 1.0.5 that
FullCalendar pulls in. The totals are close enough that this criterion decides
nothing.

## Consequences

- The calendar screen depends on `@fullcalendar/react` alone. Views are imported
  from its subpaths; there are no separate plugin packages to keep in step.
- `temporal-polyfill` is a required peer dependency and must be installed
  explicitly.
- The adapter that converts `ApiEvent` to `EventInput` is the typed boundary.
  Because `EventInput` accepts arbitrary extra keys, nothing else in the app
  should build event objects inline.
- Drag and resize persist through `eventDrop` and `eventResize`, and both must
  call `info.revert()` when the PATCH fails. Optimistic movement with no revert
  path is how an event silently drifts away from what the database holds.
- FullCalendar's hashed class names mean the calendar cannot be styled or
  asserted on from the outside. Anything a test or a stylesheet needs to reach
  must be put there deliberately, through `className` on the event.
- Revisit if `@schedule-x/drag-and-drop` ships a 4.x release. Schedule-X is the
  lighter and more React-shaped library and its async reschedule hook is a
  better design; the plugins being a major version behind the calendar they
  plug into is the disqualifier, and that is fixable.

## Rejected alternatives

**Schedule-X** — rejected because drag-to-reschedule does not work on the
current published packages, as set out above.

**Hand-building the week view again** — rejected. It is what the previous
version did, and it produced the 895-line file this project exists to replace.
Positioning events by time is easy; the cost sits in dense overlap layout,
drag hit-testing, DST, and events that cross midnight. The mock data in the
spikes includes the last two precisely because they are where a hand-built grid
starts to leak.

**`@mantine/dates`** — not an option. It renders a date picker, not a time grid.
