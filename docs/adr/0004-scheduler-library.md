# ADR-0004: Event scheduler library

**Status:** proposed — blocked on a spike
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

Pending. This ADR is updated with the outcome once the spike is done.
