# ADR-0003: Mantine as the single component library

**Status:** accepted
**Date:** 2026-09-23

## Context

A hard requirement for the rebuild: use a component library rather than
hand-writing UI. The previous version assembled its own components on top of
Radix primitives and Tailwind, which produced page-sized files
(`CalendarPage.jsx` at 895 lines, `Rooms.jsx` at 810) where layout, state and
data fetching were interleaved.

The candidates were Mantine, shadcn/ui, and MUI. A fourth option was considered
seriously: using both Mantine and shadcn/ui, taking each where it is strongest.

## Decision

Mantine 9 as the only design system, plus two single-purpose libraries for the
two components no design system ships.

## Why not mix Mantine and shadcn/ui

The premise of mixing is that each library covers the other's gaps. On
inspection that premise is false.

Mantine 9 already provides everything shadcn/ui provides — modal, drawer, menu,
tabs, combobox, select, toast, forms, date pickers, charts. There is no
meaningful set of components that shadcn/ui has and Mantine lacks.

The two components Mantine genuinely does not provide are an **event scheduler**
(week/day grid with draggable events) and a **data grid** (sorting, filtering,
pagination). shadcn/ui provides neither. Its "data table" documentation is a
tutorial for wiring TanStack Table together yourself.

So mixing would add a second design system without closing either real gap,
at a real cost:

- Tailwind's preflight resets base styles that Mantine relies on. Mantine ships
  `@mantine/core/styles.layer.css` so the two can coexist via CSS layer
  ordering — supported, but it is a workaround to maintain, not a non-issue.
- Two dark-mode mechanisms: Mantine's colour-scheme manager and Tailwind's
  `dark:` class.
- Two spacing scales, two focus-ring conventions, two portal and z-index stacks.

For a portfolio project there is a further cost: "why do you have two component
libraries?" is a harder question to defend than "why Mantine?".

## Why Mantine over shadcn/ui and MUI

**shadcn/ui** is the smoother migration — the old code already used Radix,
Tailwind and CVA, which is what shadcn/ui is. It was rejected because it leaves
the calendar and the admin table to be built by hand, which is the exact trap
that produced the 895-line calendar page.

**MUI** has the strongest data grid and date pickers of the three. Rejected
because parts of MUI X are commercially licensed, and its styling system is the
most opinionated to work against.

**Mantine** removes the most hand-written code, which is the stated requirement.
It has first-party dates, charts, forms, notifications and hooks packages, so
one theming system covers almost the whole app.

## Selected packages

| Need | Package | Version checked 2026-09-23 |
|---|---|---|
| Core UI | `@mantine/core` | 9.6.2 |
| Dates and pickers | `@mantine/dates` | 9.6.2 |
| Charts (Recharts underneath) | `@mantine/charts` | 9.6.2 |
| Forms | `@mantine/form` | 9.6.2 |
| Admin data grid | `mantine-datatable` | 9.4.0 |
| Event scheduler | see [ADR-0004](0004-scheduler-library.md) | undecided |

`mantine-react-table` was evaluated and rejected: last published February 2025,
and its peer dependencies still target Mantine 6 with Emotion. It is unmaintained.
`mantine-datatable` 9.4.0 was published July 2026 and targets Mantine 9 and
React 19.

## Consequences

- Committed to Mantine's theming system. Escaping it later means rewriting the
  UI layer, not swapping a stylesheet.
- Tailwind is not used. Layout goes through Mantine's style props and CSS modules.
- Two non-Mantine UI dependencies (the data grid and the scheduler) will look
  slightly foreign until themed against Mantine's CSS variables. Budget time for
  that rather than accepting the default skins.
