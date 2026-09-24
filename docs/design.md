# Enjazi design system

The resolved visual spec for `src/Enjazi.Web`. Everything here is expressed
as a Mantine 9 theme (`src/theme/`); screens use theme tokens and never a raw
colour or pixel size. `scripts/verify-phase-7.sh` enforces that.

Two published systems were taken as sources, both fetched with
`npx getdesign@latest add <name>` and reduced to what an application (not a
marketing site) needs:

- **Linear** (`linear.app`) — the dark scheme, the surface ladder, the single
  lavender accent, type weights and tracking, radius scale, density.
- **Cal.com** (`cal`) — the light scheme, the calendar's grid surfaces, the
  pill segmented control, avatar treatment, 40px controls.

Where they disagree the rule is: Linear decides structure and accent, Cal.com
decides the light palette. ADR-0011 records why.

## Principles

1. **One accent.** Lavender `#5e6ad2` is the only chromatic colour. It marks
   the primary action, focus, links, the active nav item and "mine". Nothing
   else is lavender. Red, green and amber appear only with a meaning:
   destructive or overdue, success or active, warning.
2. **Surfaces, not shadows.** Hierarchy is a ladder of surfaces separated by
   1px hairlines. Dark mode has no shadows at all; light mode has two faint
   ones for raised elements (dropdowns, modals).
3. **Dense and quiet.** 14px base type, 36px controls, 8px between related
   items, 24px between groups. Headings are 600, never 700.
4. **Tokens only.** A screen file contains no hex, no `px` font size and no
   font family. If a value is needed, it is added to `src/theme/` first.
5. **Both schemes stay.** The account's theme setting (light, dark, system)
   is a stored preference with a test on it. Dark follows Linear; light
   follows Cal.com; the accent is the same in both.

## Colour

### Accent — `theme.colors.lavender`, `primaryColor: 'lavender'`, `primaryShade: 6` in both schemes

| Shade | Hex | Used for |
|---|---|---|
| 0 | `#eef0fb` | light-variant background (light scheme) |
| 1 | `#dfe3f8` | |
| 2 | `#c5cbf1` | |
| 3 | `#a8b1ea` | |
| 4 | `#8b96e3` | links and `-text` in dark (Mantine uses shade 4 there) |
| 5 | `#7480da` | |
| 6 | `#5e6ad2` | **primary** — filled buttons, focus ring, active states |
| 7 | `#5560bd` | filled hover |
| 8 | `#47509e` | |
| 9 | `#383f7e` | |

### Dark scheme — `theme.colors.dark` (Linear's ladder)

Mantine reads specific indexes of `dark` for its semantic variables; the
table gives the index, the Linear token it carries, and what Mantine does
with it.

| Index | Hex | Linear token | Mantine semantic |
|---|---|---|---|
| 0 | `#f7f8f8` | ink | `--mantine-color-text` |
| 1 | `#d0d6e0` | ink-muted | |
| 2 | `#8a8f98` | ink-subtle | `--mantine-color-dimmed` |
| 3 | `#62666d` | ink-tertiary | placeholder, disabled text |
| 4 | `#23252a` | hairline | `--mantine-color-default-border` |
| 5 | `#141516` | surface-2 | `--mantine-color-default-hover` |
| 6 | `#0f1011` | surface-1 | `--mantine-color-default`, inputs, Popover |
| 7 | `#010102` | canvas | `--mantine-color-body` |
| 8 | `#18191a` | surface-3 | |
| 9 | `#191a1b` | surface-4 | |

### Light scheme — `theme.colors.gray`, `theme.black`, `theme.white` (Cal.com)

| Index | Hex | Cal.com token | Mantine semantic |
|---|---|---|---|
| 0 | `#f8f9fa` | surface-soft | `--mantine-color-default-hover` |
| 1 | `#f3f4f6` | hairline-soft | |
| 2 | `#eff1f3` | | disabled background |
| 3 | `#eaecef` | | Table borders, disabled border |
| 4 | `#e5e7eb` | hairline | `--mantine-color-default-border` |
| 5 | `#898989` | muted-soft | placeholder |
| 6 | `#6b7280` | muted | `--mantine-color-dimmed` |
| 7 | `#4b5563` | | |
| 8 | `#374151` | body | |
| 9 | `#111111` | ink | |

`theme.black = '#111111'` (text), `theme.white = '#ffffff'` (canvas).

### Scheme-specific surfaces — `cssVariablesResolver`

Mantine 9 paints `Paper`, `Card`, `Modal` and `AppShell` panels with
`--mantine-color-body`, which is the canvas. Linear lifts every card one step
above the canvas, so these variables exist and the theme's component styles
point at them.

| Variable | Light | Dark | Applied to |
|---|---|---|---|
| `--enjazi-surface-1` | `#ffffff` | `#0f1011` | Paper, Card, Table container |
| `--enjazi-surface-2` | `#f8f9fa` | `#141516` | sidebar, SegmentedControl track, row hover |
| `--enjazi-surface-3` | `#f3f4f6` | `#18191a` | active nav item, pressed states, empty-state icon disc |
| `--enjazi-surface-raised` | `#ffffff` | `#18191a` | Popover, Menu, Modal, Notification, SegmentedControl indicator |
| `--enjazi-accent-tint` | `rgba(94,106,210,.08)` | `rgba(94,106,210,.14)` | own chat messages, calendar today column, selection |

Shadows: `xs` `0 1px 2px rgba(0,0,0,.05)`, `sm` `0 1px 3px rgba(0,0,0,.06)`,
`md` `0 4px 12px rgba(0,0,0,.08)`; the dark map sets all of them to `none`.

### Semantic colours

Mantine's own `red`, `green`, `yellow`, `orange` tuples are kept. Use:
`red` for destructive actions and overdue; `green` for success and active
status; `orange` for the streak warning; `yellow` for the admin self-edit
notice. Priority markers: Low `gray`, Medium `lavender`, High `red`.

### Avatar pastels — `src/theme/palette.ts`

Cal.com's badge set, chosen by a hash of the display name:
`#fb923c` orange, `#ec4899` pink, `#8b5cf6` violet, `#34d399` emerald, plus
`#5e6ad2` lavender. Text on them is white. This is the only place an accent
other than lavender is used decoratively, and only inside avatars.

## Typography

- **Family**: Inter, self-hosted through `@fontsource-variable/inter`
  (`'Inter Variable'`), falling back to the system stack. Both sources name
  Inter as the substitute for their proprietary faces. Monospace stays the
  system stack; nothing in the app renders code.
- **Sizes** (`theme.fontSizes`): xs 12px, sm 13px, md 14px, lg 16px, xl 18px.
  `md` is the base, so every Mantine component defaults to 14px.
- **Line heights**: md 1.5; xs and sm 1.4.
- **Headings**: weight 600, `textWrap: 'balance'`.

| Order | Size | Line height | Letter-spacing | Use |
|---|---|---|---|---|
| h1 | 24px | 1.2 | -0.5px | page title (PageHeader) |
| h2 | 20px | 1.25 | -0.4px | section title, stat value |
| h3 | 16px | 1.3 | -0.2px | card title |
| h4 | 14px | 1.4 | 0 | small group title |
| h5 | 13px | 1.4 | 0 | |
| h6 | 12px | 1.4 | 0 | |

`Title` gets its letter-spacing from `theme.components.Title.styles`, keyed
on `order`, because Mantine's heading sizes carry no tracking field.

- **Eyebrow** (labels over a number, sidebar section titles): xs, weight 500,
  `+0.4px` tracking, uppercase, dimmed.
- **Body**: md 400. **Emphasis**: 500, never 700 outside headings.
- **Numbers** in stat tiles: `fontVariantNumeric: 'tabular-nums'`.

## Shape and space

- **Radius** (`theme.radius`): xs 4, sm 6, md 8, lg 12, xl 16;
  `defaultRadius: 'md'`. Buttons, inputs, menu items and nav items are `md`;
  cards, modals and the calendar frame are `lg`; badges, avatars and the
  segmented control are pill.
- **Spacing** (`theme.spacing`): xs 8, sm 12, md 16, lg 24, xl 32.
- **Controls**: buttons and inputs are 36px tall at their default size
  (`size: 'sm'`), 14px label, weight 500, 14px horizontal padding.
- **Cards**: padding `lg`, hairline border, no shadow.
- **Page**: `AppShell.Main` padding `lg` (md below `sm`). Content is
  full-bleed; forms cap their own width (480–560px).

## Components — `theme.components`

| Component | Defaults and styles |
|---|---|
| `Button` | `size: 'sm'`, weight 500, radius md. `variant="default"` is the secondary button: surface-1 background, hairline border. Destructive: `color="red"`, `variant="subtle"` in rows, `variant="light"` as a page action. |
| `ActionIcon` | `variant: 'subtle'`, `color: 'gray'`, `size: 'md'`. Every one carries `aria-label`. |
| `Input` (all inputs) | `size: 'sm'`, radius md, surface-1 background, hairline border, lavender focus ring. Labels weight 500, size sm. |
| `Paper` / `Card` | `withBorder`, radius lg, padding lg, background `--enjazi-surface-1`. |
| `Modal` | radius lg, content and header on `--enjazi-surface-raised`, overlay 55% black, title weight 600 size lg. |
| `Popover`, `Menu`, `Notification`, `Tooltip` | dropdown on `--enjazi-surface-raised`, radius md, shadow md (light only). Menu items radius sm. |
| `Badge` | `variant: 'light'`, pill, weight 500, `textTransform: 'none'`, size sm. |
| `SegmentedControl` | pill; track `--enjazi-surface-2`; indicator `--enjazi-surface-raised` with shadow xs; active label ink, inactive dimmed. |
| `NavLink` | radius md; inactive text dimmed with dimmed icon; active background `--enjazi-surface-3`, ink text, weight 500, lavender icon. |
| `Table` | `verticalSpacing: 'sm'`, `highlightOnHover`, hover row `--enjazi-surface-2`, hairline rows. |
| `Checkbox`, `Switch` | radius sm on the checkbox; lavender when checked. |
| `Alert` | `variant: 'light'`, radius md. |
| `Anchor` | lavender (Mantine's default anchor for the primary colour), underline on hover only. |
| `Loader` | lavender. |

`mantine-datatable` reads Mantine's variables; set
`--mantine-datatable-border-color` to the hairline and the row hover to
`--enjazi-surface-2` in `src/theme/global.css`.

`FullCalendar` is driven by `src/calendar/mantine-bridge.css`, remapped:
primary and events lavender; today column `--enjazi-accent-tint`; selection
highlight the same at double strength; now line `red`; borders hairline;
header cells eyebrow-styled; toolbar buttons match the default Mantine button;
event chips radius sm, 500 weight title.

## Icons

`@tabler/icons-react`, the set Mantine's documentation uses. Default size 18,
stroke 1.75. Icons appear in: sidebar items, page-header actions, row
actions (as `ActionIcon` with `aria-label`), priority and status markers,
empty states, the streak tile. A button whose only content is an icon has an
`aria-label` equal to the text it replaced, so the accessible name is
unchanged.

## Layout

**Sidebar** (`AppShell.Navbar`, 240px, `--enjazi-surface-2`, hairline right
border): wordmark row (lavender `ThemeIcon` mark + "Enjazi" at 600 with
-0.3px tracking), then the nav: Dashboard, Tasks, Calendar, Rooms, Settings;
an "Admin" eyebrow and Users for admins. Pinned to the bottom: the user row —
initials avatar, display name (500) over email (xs dimmed), both truncated,
and a `Log out` icon button.

**Header**: mobile only. `header={{ height: { base: 48, sm: 0 } }}` with
`<AppShell.Header hiddenFrom="sm">` holding the burger and the wordmark.
Desktop has no top bar; each screen starts with its own `PageHeader`.

**Shared pieces** in `src/ui/`:

- `PageHeader` — `title`, optional `description`, optional `actions`
  (right-aligned group), optional `back` link above the title. Renders the
  `h1`, then a hairline rule with `lg` space below.
- `EmptyState` — icon in a 36px `--enjazi-surface-3` disc, a title at 500,
  optional description (dimmed) and optional action. Centred, `xl` padding.
- `UserAvatar` — initials on a pastel disc, sizes `sm` (24) and `md` (32).
- `StatCard` — eyebrow label, value as `h2` with tabular numbers, optional
  rows beneath separated by hairlines, footer link. Used by the dashboard
  and the streak.

## Screens

Each screen keeps its behaviour, hooks and modals. What changes is the frame,
type, surfaces and the few UX additions named here.

- **Login / Register** — wordmark centred above a 400px card on the canvas;
  title `h1`; inputs full width; the primary button full width; the switch
  link in the footer. Error `Alert` between the fields and the button.
- **Dashboard** — `PageHeader` "Dashboard" with the "Signed in as …"
  sentence as its description. Four `StatCard`s in a 1/2/4 grid: Streak
  (flame icon next to the number, the warning in `orange`), Tasks (open count,
  overdue count in red, next three by due date), This week (next three
  events), Rooms (joined / to join, first three joined).
- **Tasks** — `PageHeader` with the filter `SegmentedControl` on the left of
  the actions and "New task" as the primary action. Rows: checkbox, title
  (struck and dimmed when done) with description beneath, priority as a
  6px dot plus label, due date dimmed or red when overdue, Edit and Delete as
  subtle `ActionIcon`s with `aria-label`s, always visible. Empty state:
  "No tasks here." with no second "New task" button.
- **Calendar** — `PageHeader` with "New event"; the grid inside a `Paper`
  with radius lg and hidden overflow, filling the viewport height below the
  header.
- **Rooms** — cards with a room avatar (initials of the name), name at 500,
  member count as a badge, description clamped to two lines, Open or Join.
- **Room** — `PageHeader` with the "All rooms" back link, description, and
  the Join / Leave / Edit / Delete actions. Below, on `md` and up, chat on the
  left (grows) and Members in a 320px `Paper` on the right; stacked below
  `md`. Messages: avatar, author name at 500 (lavender when mine), time xs
  dimmed, body; consecutive messages from the same author within five
  minutes share one header. Composer: input plus a `Send` button.
- **Settings** — three `Paper` sections with `h3` titles: Appearance (theme),
  Time (time zone), Notifications (three switches); Save right-aligned below.
- **Admin users** — `PageHeader` with the search input (search icon on the
  left) as the action; the `DataTable` inside the themed container; status as
  a dot plus label; roles as badges.

## Test contract

`e2e/*.spec.ts` drives the real screens. These accessible names and strings
are load-bearing and must survive any restyle. A button that becomes an icon
keeps its name through `aria-label`.

- Links (nav): `Dashboard`, `Tasks` (exact — the dashboard also has
  "All tasks"), `Calendar`, `Rooms`, `Settings`, `Users` (admins only, and
  absent for members), `Register`, `Log in`, `All rooms`, `Open` (rooms card).
- Buttons: `Log in`, `Create account`, `Log out` (a real button, not a menu
  item), `New task`, `New event`, `New room`, `Create`, `Save`, `Cancel`,
  `Delete`, `Edit`, `Remove`, `Leave`, `Join`, `Send`.
- Labels: `Name`, `Email`, `Password` (textbox role), `Title`, `Priority`
  (combobox), `Theme` (combobox, options `light`/`dark`/`system`), `Time zone`
  (combobox), `Room messages`, `Disabled`, `Message`, `Search users`,
  `Complete <task title>` (the row checkbox).
- Text: `Signed in as <email>.`, `No tasks here.`, `No messages yet.`,
  `Settings saved.`, `Done` (exact, the filter), `0-day streak`,
  `1-day streak, completed today`, `Longest 1 · 10 points`, priority label
  text (`High`) inside the task row, role text (`Admin`, `Member`) inside the
  member row.
- Structure: task rows and member rows are `Table` rows (`role=row`); room
  cards are Mantine `Card` (`.mantine-Card-root`) containing the Join button
  or Open link; chat messages carry `data-testid="message"`; confirm dialogs
  are `role=dialog` named by their title (`Delete event`); the `html`
  element carries `data-mantine-color-scheme`.

## Verification — `scripts/verify-phase-7.sh`

1. No hex colour outside `src/theme/` and `src/calendar/mantine-bridge.css`;
   no `fontFamily` or px `fontSize` in a `.tsx` file.
2. Everything `scripts/verify-phase-5.sh` checks: generated client current,
   typecheck, lint, build, no `fetch` outside `src/api`, no file over 200
   lines, and the full browser suite against the real API. The suite
   includes `e2e/theme.spec.ts`, which sets the account to each scheme in
   turn and checks that every screen paints on that scheme's canvas, in
   Inter, with an `h1`, and without a page error.
