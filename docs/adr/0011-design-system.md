# ADR-0011: One design system — Linear's dark, Cal.com's light, one accent

**Status:** accepted
**Date:** 2026-09-24

## Context

Phases 4 to 6 built every screen on Mantine's defaults: blue accent, system
font, 16px base, default radii. Phase 7 replaces that with a published
design system so the app reads as one product rather than a component
library demo. The plan's check is that the values live in one place, that
both colour schemes paint correctly, and that nothing the earlier phases
verified breaks.

Two candidate systems were fetched with `npx getdesign@latest add <name>`,
each a 550-line analysis of the brand's marketing site: **Linear**, whose
product is the closest in kind (task lists, dense rows, a sidebar, one
accent), and **Cal.com**, whose product is a calendar on a white canvas.
Neither is an application spec: Linear's forbids a light mode and Cal.com's
has no dark one, and both describe hero bands and pricing tiers the app
does not have. `docs/design.md` is what remains after reducing them to what
an application needs; the raw files are not committed.

The mechanism, stated before the decisions:

1. A Mantine theme is a set of CSS custom properties. `createTheme` values
   become `--mantine-*` variables on `:root`, and every component reads
   those, so a design system is a mapping of its tokens onto Mantine's
   indexes. The indexes are fixed: in the dark scheme `theme.colors.dark[7]`
   is `--mantine-color-body`, `[6]` is the default control surface, `[4]`
   the default border, `[2]` dimmed text, `[0]` text; in light the same
   roles fall on `gray[0]` (hover), `gray[4]` (border), `gray[6]` (dimmed)
   and `theme.black` (text). A ten-step ramp therefore has to be ordered
   so the right hex lands on each index, which is why the tables in
   `docs/design.md` carry a "Mantine semantic" column.
2. The scheme is an attribute, `data-mantine-color-scheme` on `html`. A
   `cssVariablesResolver` returns three maps — `variables`, `light`, `dark`
   — and Mantine emits the last two under that attribute's selector. A
   value that differs by scheme is therefore a variable, not a condition in
   a component, and it switches with no JavaScript.
3. Per-component defaults come from `theme.components`: `defaultProps` for
   what a prop exposes, `vars` for the component's own variables
   (`--button-fz`, `--nl-bg`), `styles` for the rest. What none of those
   reach — a state Mantine styles with no variable — is a rule in one
   global stylesheet.
4. Two dependencies do not read the theme object. FullCalendar's classic
   theme exposes `--fc-classic-*` variables plus class-name hooks per
   element (`buttonClass`, `dayHeaderInnerClass`, `blockEventClass`);
   `mantine-datatable` exposes `--mantine-datatable-*` variables with a
   light and a dark suffix. Both are driven from the same variables the
   rest of the theme uses.

## Decisions

### Linear decides structure and accent; Cal.com decides the light palette

Linear's ladder — near-black canvas, four lifted surfaces, hairlines, no
shadows — is the dark scheme index for index (`docs/design.md`, "Dark
scheme"). Cal.com's white canvas, `#f8f9fa` soft surface and `#e5e7eb`
hairline are the light scheme. The lavender `#5e6ad2` is the primary colour
in both, at shade 6 in both, so the one accent holds across the switch.
Type, radius, spacing and density are Linear's, which are also what Cal.com
uses at the sizes an application needs; the two agree on Inter, 8px controls
and 12px cards.

Rejected: *a single source.* Linear alone has no light mode and Cal.com
alone has no dark one; deriving the missing scheme by inverting values
produced worse results than taking each from a brand that designed it.
*A third source* (Notion, for warmth on the rooms screen) was considered and
dropped: three vocabularies on six screens read as three products.

### Both schemes stay

The account's theme setting (light, dark, system) has existed since Phase 3,
is stored on the server, and has a browser test. Linear's "don't ship a
light-mode marketing page" is a rule for a marketing site, not for an
application used at a desk in daylight. Dropping light mode would remove a
stored field from the API contract for the sake of a rule that does not
apply.

### Surfaces above the canvas are resolver variables

Mantine 9 paints `Paper`, `Card`, `Modal` content and the `AppShell` panels
with `--mantine-color-body`, which is the canvas. Linear lifts every card one
step above it. Five `--enjazi-*` variables (`surface-1` to `surface-3`,
`surface-raised`, `accent-tint`) carry the ladder per scheme, and the theme's
component entries point `Paper`, `Modal`, `Popover`, `Menu`, `Notification`,
`Tooltip`, `SegmentedControl` and the sidebar at them. Dark mode also sets
every `--mantine-shadow-*` to `none` in the same map.

Rejected: *re-ordering `dark` so that `[7]` is surface-1.* Then the canvas
has no index at all, and inputs, which read `[6]`, land on the wrong step.

### Paper has no default padding

`Card` and `Modal` content both render through `Paper`, and a `p` default on
`Paper` is a style prop that becomes inline padding on those elements —
doubling the modal's and clashing with `Card`'s own `--card-padding`.
`Card` defaults to `padding="lg"`; a bare `Paper` passes `p="lg"` itself.

### Inter, self-hosted

Both sources name Inter as the substitute for their proprietary faces. It is
bundled through `@fontsource-variable/inter` and served with the app: no
request to a font CDN, no third party in the page, and the app works with
the network off. The `.woff2` subsets are emitted as build assets and only
the ones the page needs are fetched.

Rejected: *Google Fonts.* An external request on every load for a file that
can be shipped with the app, and a dependency on a third party's uptime and
privacy terms.

### Tabler icons, reversing ADR-0009

ADR-0009 chose text-only actions and no icon package. Linear's grammar is
icon-led — sidebar items, row actions, priority and status markers — and a
row of five text buttons cannot express it. `@tabler/icons-react` is the set
Mantine's own documentation uses and it tree-shakes: the production bundle
holds only the icons imported. Every icon-only button is an `ActionIcon`
with an `aria-label` equal to the text it replaced, so accessible names —
and therefore every existing browser test — are unchanged.

### Values live in the theme and nowhere else

A screen file contains no hex colour, no pixel font size and no font family.
`scripts/verify-phase-7.sh` fails on any of them outside `src/theme/` and
the FullCalendar bridge stylesheet. The previous version's pages set colours
inline and the theme meant nothing; this rule is what keeps the theme the
one place a colour is decided.

### Shared pieces are few and dumb

`src/ui/` holds `PageHeader`, `EmptyState`, `StatCard`, `UserAvatar` and
`Eyebrow`, each a layout with no data access and no state. Every signed-in
screen starts with a `PageHeader` because the desktop layout has no top bar:
the sidebar holds the wordmark, the navigation and the user row, and a
header exists only below the `sm` breakpoint, where it holds the burger.

Rejected: *a generic list or table component.* The same reasoning as
ADR-0009: three short lists are easier to read than one configurable one.

### What the theme object cannot reach goes in one global stylesheet

`src/theme/global.css` holds the `mantine-datatable` variables, the
`::selection` tint, and the one Mantine state with no variable of its own —
the inactive `SegmentedControl` label. Nothing else. Anything a component
can express through `theme.components` is not allowed there.

## What the phase found

**`tsc -b` typechecks the browser tests with Node's library.**
`tsconfig.node.json` covers `e2e/` and had `lib: ["ES2023"]`, so a callback
passed to `page.evaluate` could not name `document`. The Phase 4–6 tests
never did. The theme test does — it reads the computed canvas colour and
asks `document.fonts` whether Inter loaded — so the DOM library was added to
that config. The callbacks do run in the page; the config now says so.

**The calendar's drag test guards layout, not only behaviour.** The grid
is sized to fill the viewport below the page header with a `calc()` that
subtracts the header's parts. The first version lost a pair of parentheses
— `- lg + md + 37px` instead of `- (lg + md + 37px)` — and the grid came out
106px too tall, clipped by the frame's `overflow: hidden`. Nothing looked
wrong at a glance. The Phase 5 drag test failed, because it moves the mouse
to the event's coordinates and the 17:00 event sat below the fold where no
pointer can reach it. A layout error surfaced as a behaviour failure.

**`Group` drops a `0`.** Mantine's `Group` filters falsy children so that
`{condition && <X />}` leaves no gap, and a streak of zero rendered as a
flame with no number beside it. No test reads the tile's number — the
streak test reads the sentence beneath — so this was found by looking at
the screen, which is the check a design phase needs and the verify script
cannot give. The value is passed as a string.

**Playwright's strict mode makes accessible names a contract.** A
restyled empty state that offered a second "New task" button would have
broken the tasks test, because `getByRole('button', { name })` refuses two
matches. The spec's "Test contract" section lists every name the tests
depend on, and the empty states carry no action that duplicates a page
action.

## Rejected alternatives

- **Tailwind or shadcn/ui for the restyle.** ADR-0003's reasoning has not
  changed; a second styling system is a second place for values to live.
- **Dark only.** See "Both schemes stay".
- **One CSS module per screen.** Puts values outside the theme, which is the
  exact state the verify script exists to prevent.
- **Replacing `mantine-datatable` or FullCalendar's skin by hand.** ADR-0003
  budgeted time for theming the two non-Mantine dependencies, not for
  rewriting them; both expose enough variables and class hooks.
- **Committing the raw `DESIGN.md` files from getdesign.** 60 KB of
  marketing-site analysis, most of it about hero bands and pricing tiers.
  The resolved spec is `docs/design.md`; the sources are named there and can
  be refetched with the commands in it.

## Consequences

- A colour is changed in `src/theme/palette.ts` and nowhere else. A screen
  that needs a value the theme lacks adds it to the theme first, or fails
  `verify-phase-7.sh`.
- A new screen starts with `PageHeader`, uses `Card` for tiles, `Paper
  p="lg"` for sections, `EmptyState` for nothing-here, and Tabler icons at
  18/1.75 with `aria-label`s on icon-only buttons.
- Dark hairlines are faint by design (`#23252a` on `#0f1011`); the ladder
  carries the hierarchy, not the borders.
- `tsconfig.node.json` includes the DOM library; a browser-test callback may
  use page globals, and a Node-side helper that accidentally does will no
  longer be caught by the compiler.
- ADR-0009's "no icon package" is superseded by this record.
