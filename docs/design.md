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

Those two are the `enjazi` palette. Structure, type, space and motion are
fixed for the whole app; colour is a palette, and three more published ones
sit beside it — Nord, Solarized and Dracula. ADR-0013 records why and how
one is chosen.

## Principles

1. **One accent per palette.** A palette has exactly one chromatic colour.
   It marks the primary action, focus, links, the active nav item and
   "mine". Nothing else uses it. Red, green and amber appear only with a
   meaning: destructive or overdue, success or active, warning.
2. **Surfaces, not shadows.** Hierarchy is a ladder of surfaces separated by
   1px hairlines. Dark mode has no shadows at all; light mode has two faint
   ones for raised elements (dropdowns, modals).
3. **Dense and quiet.** 14px base type, 36px controls, 8px between related
   items, 24px between groups. Headings are 600, never 700.
4. **Tokens only.** A screen file contains no hex, no `px` font size and no
   font family. If a value is needed, it is added to `src/theme/` first.
5. **Both schemes stay, in every palette.** The account stores two
   appearance settings, each with a test on it: the scheme (light, dark,
   system) and the palette. Every palette has a light and a dark scheme,
   and the accent hue is the same in both.
6. **Quiet, not static.** Every change the user causes answers at once and
   moves for 120–180ms. Motion confirms a change; it never decorates. Under
   the OS's reduced-motion setting nothing moves, and nothing is lost.

## Colour

Four palettes. Each is a whole set — an accent ramp, a dark ladder, a light
ladder and the surfaces — and each has a light and a dark scheme, so the
scheme setting and the palette setting are independent. The account stores
which palette is active; ADR-0013 records the decision and how switching
works.

| Id | Name | Source | Accent |
|---|---|---|---|
| `enjazi` | Enjazi | Linear (dark) and Cal.com (light) | lavender |
| `nord` | Nord | Nord | frost blue |
| `solarized` | Solarized | Solarized | blue |
| `dracula` | Dracula | Dracula (dark) and Alucard (light) | purple |

`enjazi` is the default and is the Phase 7 system unchanged except where the
contrast rule below moved a value.

### Roles

Every palette fills the same three tuples. Mantine reads fixed indexes of
`theme.colors.dark` and `theme.colors.gray` for its semantic variables, so
the ladders are ordered by what Mantine does with them, not by lightness.
`theme.primaryColor` is always `accent`, and `primaryShade` is per scheme.

| Index | `accent` | `dark` (dark scheme) | `gray` (light scheme) |
|---|---|---|---|
| 0 | light-variant background in light | ink — `--mantine-color-text` | `--mantine-color-default-hover` |
| 1 | `-light` background | ink-muted | hairline-soft |
| 2 | `-light-hover` | dimmed — `--mantine-color-dimmed` | disabled background |
| 3 | | placeholder, disabled text | Table borders, disabled border |
| 4 | links and `-text` in dark | hairline — `--mantine-color-default-border` | hairline — `--mantine-color-default-border` |
| 5 | | surface-2 — `--mantine-color-default-hover` | placeholder |
| 6 | | surface-1 — `--mantine-color-default`, inputs | dimmed — `--mantine-color-dimmed` |
| 7 | | canvas — `--mantine-color-body` | |
| 8 | | surface-3 | body |
| 9 | `-light-color` in light | surface-4 | ink |

`theme.black` is the light scheme's ink, `theme.white` its canvas.
`--enjazi-surface-1` … `--enjazi-surface-raised` and
`--enjazi-accent-tint` come from the resolver, as in Phase 7; Mantine 9
paints `Paper`, `Card`, `Modal` and `AppShell` panels with
`--mantine-color-body`, which is the canvas, and these lift them a step
above it.

`theme.autoContrast` is on. A filled element's label is `theme.black` or
white, whichever reads on the fill, decided by Mantine at a 0.3 luminance
threshold. Two palettes need it: their dark-scheme primary is the pale end
of the accent ramp, because the mid ramp is too close to their canvas to
read as a button at all.

### Contrast

Every palette clears WCAG AA, and `e2e/colors.spec.ts` checks it with
axe-core in both schemes. The rules the values were chosen against:

- Ink, body and dimmed text clear 4.5:1 on **every** surface they can land
  on, which includes surface-3: a hovered nav link is surface-3 with dimmed
  text.
- Placeholder and disabled text clear 4.5:1 on surface-1, because an input
  paints its own surface-1 background wherever it sits.
- The accent as text — links, and an own message's author name — clears
  4.5:1 on the canvas, on surface-1 and on the accent tint over surface-1.
  The light scheme's `primaryShade` is the first shade that does all three
  and still carries its own label; that is why it is 7 and not 6 in
  `enjazi`.
- A filled primary stands 3:1 apart from the canvas behind it.
- `red`, `green`, `orange` and `yellow` as text clear 4.5:1 on every
  surface, which Mantine's own ramps do not: `--mantine-color-red-text` is
  shade 6 in light, 3.2:1 on white. Each palette overrides the four
  `-text` variables per scheme, so `c="red"` and `c="orange"` in a screen
  need no change.
- Hairlines, priority dots, the week row and icons are not text and are not
  held to 4.5:1.

Values were computed, not picked: each source's own token is the starting
point and is moved along lightness only, in Lab, until it clears the ratio,
which keeps the hue the source chose. Where a value below differs from the
published token, that is why. Three of them were already failing before this
phase in `enjazi`: the placeholder gray, the overdue red and the avatar
discs.

### Enjazi — `enjazi`

Linear (dark) and Cal.com (light), lavender accent. Primary shade 7 in light, 6 in dark.

| Index | accent | `dark` | `gray` |
|---|---|---|---|
| 0 | `#eef0fb` | `#f7f8f8` | `#f8f9fa` |
| 1 | `#dfe3f8` | `#d0d6e0` | `#f3f4f6` |
| 2 | `#c5cbf1` | `#8a8f98` | `#eff1f3` |
| 3 | `#a8b1ea` | `#797d84` | `#eaecef` |
| 4 | `#8b96e3` | `#23252a` | `#e5e7eb` |
| 5 | `#7480da` | `#141516` | `#757575` |
| 6 | `#5e6ad2` | `#0f1011` | `#676e7c` |
| 7 | `#5560bd` | `#010102` | `#4e5766` |
| 8 | `#47509e` | `#18191a` | `#374151` |
| 9 | `#383f7e` | `#191a1b` | `#111111` |

`black` `#111111`, `white` `#ffffff`.

| Variable | Light | Dark |
|---|---|---|
| `--enjazi-surface-1` | `#ffffff` | `#0f1011` |
| `--enjazi-surface-2` | `#f8f9fa` | `#141516` |
| `--enjazi-surface-3` | `#f3f4f6` | `#18191a` |
| `--enjazi-surface-raised` | `#ffffff` | `#18191a` |
| `--enjazi-accent-tint` | accent 6 at 0.08 | accent 6 at 0.14 |
| `--mantine-color-red-text` | `#c92a2a` | `#fa5252` |
| `--mantine-color-green-text` | `#1d7f34` | `#2f9e44` |
| `--mantine-color-orange-text` | `#ca3a00` | `#e8590c` |
| `--mantine-color-yellow-text` | `#b65000` | `#e67700` |

### Nord — `nord`

Nord: polar night and snow storm, frost accent. Primary shade 8 in light, 4 in dark.

| Index | accent | `dark` | `gray` |
|---|---|---|---|
| 0 | `#eaf2f8` | `#eceff4` | `#e5e9f0` |
| 1 | `#d8e4ee` | `#e5e9f0` | `#dee3ed` |
| 2 | `#b9cddf` | `#b5bfcf` | `#d8dee9` |
| 3 | `#adc7e1` | `#9da7b8` | `#cdd5e2` |
| 4 | `#a1c1e3` | `#4c566a` | `#c2ccdc` |
| 5 | `#6e91b5` | `#3b4252` | `#677285` |
| 6 | `#5e81ac` | `#343b49` | `#4c566a` |
| 7 | `#52739a` | `#2e3440` | `#434c5e` |
| 8 | `#466488` | `#434c5e` | `#3b4252` |
| 9 | `#3a5576` | `#55607a` | `#2e3440` |

`black` `#2e3440`, `white` `#eceff4`.

| Variable | Light | Dark |
|---|---|---|
| `--enjazi-surface-1` | `#f9fafc` | `#343b49` |
| `--enjazi-surface-2` | `#e5e9f0` | `#3b4252` |
| `--enjazi-surface-3` | `#d8dee9` | `#434c5e` |
| `--enjazi-surface-raised` | `#f9fafc` | `#3b4252` |
| `--enjazi-accent-tint` | accent 6 at 0.14 | accent 6 at 0.18 |
| `--mantine-color-red-text` | `#be1c22` | `#ffa8a8` |
| `--mantine-color-green-text` | `#007026` | `#69db7c` |
| `--mantine-color-orange-text` | `#b82900` | `#ffc078` |
| `--mantine-color-yellow-text` | `#a54200` | `#fab005` |

### Solarized — `solarized`

Solarized: base03..base3, blue accent. Primary shade 8 in light, 7 in dark.

| Index | accent | `dark` | `gray` |
|---|---|---|---|
| 0 | `#e8f4fd` | `#9eacac` | `#f5efdc` |
| 1 | `#cfe7f8` | `#9bacaf` | `#eee8d5` |
| 2 | `#a5d2f0` | `#9aadaf` | `#e6dfcb` |
| 3 | `#79bce8` | `#8198a0` | `#dfd9c3` |
| 4 | `#62b0e9` | `#2e4f58` | `#d9d2bc` |
| 5 | `#3d95d6` | `#073642` | `#5f7375` |
| 6 | `#268bd2` | `#03303c` | `#546a71` |
| 7 | `#1075b4` | `#002b36` | `#304f59` |
| 8 | `#14669d` | `#1c424d` | `#073642` |
| 9 | `#0e5583` | `#274953` | `#002b36` |

`black` `#002b36`, `white` `#fdf6e3`.

| Variable | Light | Dark |
|---|---|---|
| `--enjazi-surface-1` | `#fdf6e3` | `#03303c` |
| `--enjazi-surface-2` | `#f4eedb` | `#073642` |
| `--enjazi-surface-3` | `#eee8d5` | `#1c424d` |
| `--enjazi-surface-raised` | `#fdf6e3` | `#1c424d` |
| `--enjazi-accent-tint` | accent 6 at 0.12 | accent 6 at 0.16 |
| `--mantine-color-red-text` | `#c62728` | `#ff8787` |
| `--mantine-color-green-text` | `#0e772d` | `#51cf66` |
| `--mantine-color-orange-text` | `#c13200` | `#ff922b` |
| `--mantine-color-yellow-text` | `#ac4800` | `#f59f00` |

### Dracula — `dracula`

Dracula (dark) and Alucard (light), purple accent. Primary shade 8 in light, 4 in dark.

| Index | accent | `dark` | `gray` |
|---|---|---|---|
| 0 | `#f4ecff` | `#f8f8f2` | `#f7f2e0` |
| 1 | `#e7daff` | `#c8cfdb` | `#f2edd9` |
| 2 | `#d6bffc` | `#a7b0d0` | `#efe9d5` |
| 3 | `#c9a8fa` | `#9099bd` | `#e6dfc7` |
| 4 | `#bf95fb` | `#44475a` | `#ddd5ba` |
| 5 | `#a97ef0` | `#343746` | `#7a7458` |
| 6 | `#9560e4` | `#2e303e` | `#6c664b` |
| 7 | `#7f4ed6` | `#282a36` | `#4f4c3f` |
| 8 | `#6b3fc4` | `#393c4c` | `#333333` |
| 9 | `#5932ab` | `#4d5169` | `#1f1f1f` |

`black` `#1f1f1f`, `white` `#fffbeb`.

| Variable | Light | Dark |
|---|---|---|
| `--enjazi-surface-1` | `#fffdf7` | `#2e303e` |
| `--enjazi-surface-2` | `#f6f1df` | `#343746` |
| `--enjazi-surface-3` | `#efe9d5` | `#393c4c` |
| `--enjazi-surface-raised` | `#fffdf7` | `#343746` |
| `--enjazi-accent-tint` | accent 6 at 0.12 | accent 6 at 0.17 |
| `--mantine-color-red-text` | `#c62728` | `#ff8787` |
| `--mantine-color-green-text` | `#11782e` | `#40c057` |
| `--mantine-color-orange-text` | `#c13200` | `#ff922b` |
| `--mantine-color-yellow-text` | `#ae4900` | `#f59f00` |

### Semantic colours

Mantine's own `red`, `green`, `yellow`, `orange` tuples are kept, with the
`-text` variable of each overridden per palette and scheme as above. Use:
`red` for destructive actions and overdue; `green` for success and active
status; `orange` for the streak — the flame, the warning, the days of the
current run and the points moment; `yellow` for the admin self-edit
notice. Priority markers: Low `gray`, Medium the accent, High `red`.

### Avatar discs — `src/theme/avatars.ts`

Cal.com's badge set, darkened until white initials clear 4.5:1 on them, and
the same in every palette and both schemes. The initials are `#ffffff`, set
in the same file, not the palette's `white`: Nord, Solarized and Dracula use
an off-white there, which falls under 4.5:1 on these discs. `#b95b00` orange, `#d52e85` pink, `#8456ef`
violet, `#008652` emerald, `#5e6ad2` lavender. Mantine picks one by a hash
of the display name. This is the only place a colour other than the
palette's accent is used decoratively, and only inside avatars.

Shadows are palette-independent: `xs` `0 1px 2px rgba(0,0,0,.05)`, `sm`
`0 1px 3px rgba(0,0,0,.06)`, `md` `0 4px 12px rgba(0,0,0,.08)`; the dark
map sets all of them to `none`.

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

## Motion — `src/theme/motion.ts`

Nothing here is hand-animated. Three mechanisms already in the stack carry
all of it, and `motion.ts` holds the one set of numbers they share:

- **Mantine's own transitions** (`Modal`, `Popover`, `Menu`, `Tooltip`,
  `Spotlight`, `SegmentedControl`, `FloatingIndicator`, `AppShell`,
  `Burger`, `Notifications`) take `transitionProps` or a duration prop in
  milliseconds, set once in `theme.components` (or on `<Notifications>` in
  `main.tsx`) from `durations`.
- **CSS colour transitions** (hover and press on rows, buttons, nav links,
  the checkbox) read `--enjazi-duration-fast` and `--enjazi-ease`, which the
  resolver emits from the same numbers.
- **The `motion` library** (motion.dev) for the app's own movement: rows
  entering, leaving and changing place, the list and its empty state
  swapping, the points float, the flame pop, the week row. Elements are
  `m.*` from `motion/react-m` under `LazyMotion` (`domMax`, loaded after
  the first render from `src/theme/motionFeatures.ts`); `MotionConfig` in
  `main.tsx` sets `transitions.base` as the default and
  `reducedMotion="user"`. Components use `transitions.*` and `offsets.*`;
  they never write a number.

| Token | Value | Used for |
|---|---|---|
| `durations.fast` | 120ms | hover, press, colour changes, the checkbox tick, tooltips |
| `durations.base` | 180ms | enter and leave: modal, popover, menu, palette, rows, the nav marker, the segmented control's indicator |
| `durations.moment` | 700ms | the points float and the flame pop. Nothing else runs longer than `base`. |
| `durations.linger` | 800ms | a task completed in the Open view stays in place this long before it leaves. A pause, not an animation. |
| `easing` | `cubic-bezier(0.2, 0, 0, 1)` | everything; decelerating |
| `offsets.enter` | 4 | pixels an arriving task row rises |
| `offsets.rise` | 16 | pixels the points float travels |
| `offsets.pop` | 1.25 | how much the flame swells |
| `transitions.base/moment` | the above in seconds | the `motion` library's `transition` prop |

Where motion applies:

| Element | Motion |
|---|---|
| Table rows | background colour on hover, `fast`; task rows enter, leave and move with `motion`, `base` |
| Buttons, action icons, nav links | background, border and text colour, `fast` |
| Checkbox | fill, border and tick, `fast` |
| Modal | `pop` transition, `base`; overlay fades with it |
| Popover, Menu | `pop` transition, `base` |
| Tooltip | `fade` transition, `fast` |
| SegmentedControl | indicator slides, `base` |
| Sidebar nav | the active background is a `FloatingIndicator` that slides to the active link, `base` |
| Navbar (mobile), burger | the navbar slides in and out and the burger turns, `base` |
| Notifications | slide and fade, `base` |
| Spotlight | `pop` transition, `base` |
| Streak chip | `+N` floats up by `offsets.rise` and fades over `moment`; the flame swells to `offsets.pop` and back when the run grows |
| Week row | a dot filling scales in, `base` |
| Skeleton | Mantine's pulse |

Comboboxes (`Select`, the time zone list) keep Mantine's instant dropdown:
a list you type into should not lag behind the typing.

**Reduced motion.** `theme.respectReducedMotion` makes Mantine's
transitions run at zero duration when the OS asks, and
`MotionConfig reducedMotion="user"` makes the `motion` library drop
transform and layout animation while keeping opacity. So nothing moves,
and the points moment still shows, fading in place, because it carries
information rather than movement. Colour transitions stay: a colour fade is
not movement.

**Tokens only.** `scripts/verify-phase-8.sh` fails on a millisecond literal
or a numeric duration prop outside `src/theme/`, the same way Phase 7's
script fails on a hex colour.

## Loading

A load never swaps the layout for a spinner. While a query is pending, the
screen renders its frame (the `PageHeader` and any section frames) and
`Skeleton` shapes where the content will be, sized like it, so nothing moves
when the data arrives. The skeleton container is an indeterminate
`role="progressbar"` with an `aria-label` naming what is loading ("Loading
tasks"); its children are presentational, which is what placeholders are.

- **Tasks** — one group header bar the height of the eyebrow line and five
  rows with the real row's cells: a checkbox square, a title bar, a priority
  dot and short bar, a date bar, and a block the size of the two row
  actions, so each row is as tall as a loaded one. The streak chip in the
  header is a `Skeleton` named "Loading streak" until the streak loads.
- **Settings** — the three section `Paper`s, each with a title bar and a
  description bar, then the fields' shapes: a label bar over a 36px control
  bar for Theme and for Time zone, and three switch rows (a switch shape and
  a label bar) for Notifications. Each skeleton section is the height of the
  loaded one.
- **Rooms** — three card skeletons in the grid.
- **Room** — the real "All rooms" back link, bars for the title and the
  description, then the chat and members frames; the members list shows
  three rows while it loads.
- **Admin users** — the exception. `mantine-datatable` keeps its header
  and the current rows while it fetches the next page or search, and lays
  its own loader over them; the layout does not move, so it stays.

Spinners remain only where there is no layout yet: signing in on first load
(`RequireAuth`) and a lazy route's first fetch (`hydrateFallbackElement`).

## Keyboard

| Keys | Does |
|---|---|
| `N` | New task: goes to `/tasks?new`, which opens the create modal |
| `G` then `D`, `T`, `C`, `R`, `S` | Go to Dashboard, Tasks, Calendar, Rooms, Settings |
| `G` then `U` | Go to Users (admins only) |
| `⌘K` / `Ctrl K` | Open the command palette |
| `Esc` | Close the palette or a modal (Mantine's own) |

Shortcuts are `tinykeys` subscriptions in one layout hook, one per binding:
`n`, the `g d` … `g u` sequences (the second key within one second) and
`$mod+k`. One per binding because a shared map stops at the first binding
that fires and leaves the others half-matched, which drops the next quick
`G` sequence.
One rule applies to all of them: they are ignored on a key repeat, during
IME composition, while typing in a text field, textarea, select or editable
element, and inside an open dialog; modifiers must match exactly, so `N`
does not fire with Cmd, Ctrl or Alt held. They do fire while a checkbox or
radio has focus, so ticking a task and pressing `N` works. The palette's
own `mod+K` binding is off, so `⌘K` follows the same rule and never opens
the palette over a modal.

**Command palette** — `@mantine/spotlight`, rendered once in the layout,
as a dialog named "Command palette". Search placeholder "Search or jump
to…", empty text "Nothing found.". Three
groups: **Go to** (the nav destinations, admins also Users, each with its
`G` hint in a `Kbd`), **Create** (New task, with `N`), **Tasks** (open
tasks by title; choosing one goes to `/tasks?edit=<id>`, which opens its
edit modal). Actions carry an 18/1.75 icon on the left.

Shortcuts are discoverable where they apply: the sidebar's Search row shows
`⌘K`, the "New task" button's tooltip shows `N`, the tasks empty state's
action shows `N`, and every palette action shows its keys.

## Components — `theme.components`

| Component | Defaults and styles |
|---|---|
| `Button` | `size: 'sm'`, weight 500, radius md. `variant="default"` is the secondary button: surface-1 background, hairline border. Destructive: `color="red"`, `variant="subtle"` in rows, `variant="light"` as a page action. |
| `ActionIcon` | `variant: 'subtle'`, `color: 'gray'`, `size: 'md'`. Every one carries `aria-label`. |
| `Input` (all inputs) | `size: 'sm'`, radius md, surface-1 background, hairline border, accent focus ring. Labels weight 500, size sm. |
| `Paper` / `Card` | `withBorder`, radius lg, padding lg, background `--enjazi-surface-1`. |
| `Modal` | radius lg, content and header on `--enjazi-surface-raised`, overlay 55% black, title weight 600 size lg. |
| `Popover`, `Menu`, `Notification`, `Tooltip` | dropdown on `--enjazi-surface-raised`, radius md, shadow md (light only). Menu items radius sm. |
| `Badge` | `variant: 'light'`, pill, weight 500, `textTransform: 'none'`, size sm. |
| `SegmentedControl` | pill; track `--enjazi-surface-2`; indicator `--enjazi-surface-raised` with shadow xs; active label ink, inactive dimmed. |
| `NavLink` | radius md; inactive text dimmed with dimmed icon; active: ink text, weight 500, accent icon, and no background of its own — the sidebar's `FloatingIndicator` paints `--enjazi-surface-3` behind it and slides between links. Hover `--enjazi-surface-3`. |
| `Table` | `verticalSpacing: 'sm'`, `highlightOnHover`, hover row `--enjazi-surface-2`, hairline rows. |
| `Checkbox`, `Switch` | radius sm on the checkbox; the accent when checked. |
| `Alert` | `variant: 'light'`, radius md. |
| `Anchor` | the accent (Mantine's default anchor for the primary colour), underline on hover only. |
| `Loader` | the accent. Only for app boot; screens use `Skeleton`. |
| `Skeleton` | `--enjazi-surface-3` in both schemes, radius sm; Mantine's pulse. |
| `Kbd` | size xs, `--enjazi-surface-2` background, hairline border, radius sm, dimmed text, weight 500. |
| `Spotlight` | content on `--enjazi-surface-raised`, radius lg, overlay as `Modal`; search input 48px, borderless, hairline below; actions radius md, hover `--enjazi-surface-2`; the keyboard-selected action `--enjazi-accent-tint` with a 2px inset bar in the primary colour on its left, because the selection is the only sign of what Enter will run; group labels eyebrow-styled. |

Transitions for each component are in the "Motion" table and set in the
same `theme.components` entries.

`mantine-datatable` reads Mantine's variables; set
`--mantine-datatable-border-color` to the hairline and the row hover to
`--enjazi-surface-2` in `src/theme/global.css`.

`FullCalendar` is driven by `src/calendar/mantine-bridge.css`, remapped:
primary and events in the accent; today column `--enjazi-accent-tint`; selection
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
border): wordmark row (accent `ThemeIcon` mark + "Enjazi" at 600 with
-0.3px tracking), a Search row styled like a nav link (search icon,
"Search", `⌘K` in a `Kbd` on the right) that opens the command palette,
then the nav: Dashboard, Tasks, Calendar, Rooms, Settings;
an "Admin" eyebrow and Users for admins. The active link's background is a
`FloatingIndicator` that slides to whichever link is active. Pinned to the
bottom: the user row —
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
  An empty state that has an obvious next step offers it as the action,
  with a name that differs from the page's own action (see "Test contract").
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
  (flame icon next to the number, the week row, the warning in `orange`),
  Tasks (open count, overdue count in red, next three by due date), This
  week (next three events), Rooms (joined / to join, first three joined).
  - **Week row** — the streak tile's first row: seven 10px dots for the
    last seven days, oldest on the left, each over its weekday initial (xs,
    dimmed). A day in the current run is a filled `orange` dot. Today, not
    yet completed, is a ring: `orange` while the run is alive (the day that
    keeps it), hairline when there is no run. Every other day is a
    `--enjazi-surface-3` disc. The API stores the run, not a log of days
    (ADR-0012), so a day that belonged to an earlier, broken run shows
    empty: the row reads as "this run", not as a history. The row is one
    `role="img"` with the label "`<n>` of the last 7 days in the current
    streak"; the dots and initials are `aria-hidden`.
- **Tasks** — `PageHeader` with the streak chip, the filter
  `SegmentedControl` and "New task" (tooltip `N`) as the actions.
  - **Streak chip** — the flame and the current length, `orange` when the
    run is alive and dimmed otherwise, with a tooltip "`<n>`-day streak ·
    `<p>` points". Visually hidden text makes it read "`<n>`-day streak,
    `<p>` points" to a screen reader, since the tooltip is hover-only. When the streak's points rise, `+<Δ>` in `orange` floats
    up from it and fades (see "Motion") and a visually hidden live region
    says "`+<Δ>` points"; when the length rises the flame pops. The
    delta is read from the streak query before and after, not assumed.
  - **Groups** — one table, divided by due date: Overdue, Today, This week,
    Later, No date, Completed, in that order, each opened by a header row
    (eyebrow label and a dimmed count). Empty groups are omitted. Overdue is
    open and due before now; Today is due from now until midnight; This week
    is due from tomorrow until the end of the seventh day from today; Later
    is after that. Completed holds every completed task. Dated groups sort
    by due date ascending, No date by creation (newest first), Completed by
    completion (newest first).
  - **Rows** — checkbox, title (struck and dimmed when done) with
    description beneath, priority as a 6px dot plus label, due date dimmed or
    red when overdue, Edit and Delete as subtle `ActionIcon`s with
    `aria-label`s, always visible.
  - **Ticking** a box changes the row at once, before the request answers,
    and reverts with a notification if the request fails (ADR-0012). In the
    Open view a task just completed stays in its group, struck through, for
    `durations.linger`, then leaves; in All it moves to Completed after the
    same pause. Delete removes the row at once the same way.
  - **Inline rename** — the title is a button; clicking it turns it into an
    input in place, labelled `Task title`, holding the title. Enter or
    leaving the field saves; Escape cancels; an unchanged or empty title
    saves nothing. The save is optimistic like the tick. Edit still opens
    the full modal for everything else.
  - **Empty state** — "No tasks here." in every filter, with a description
    per case: no tasks at all, "Add your first task to start a streak."; Open
    with only completed tasks, "Everything open is done."; Done, "Completed
    tasks show up here.". The action is "Add a task" with `N` in a `Kbd`.
  - `?new` opens the create modal and `?edit=<id>` the edit modal of that
    task once the list has loaded; closing either removes the parameter.
- **Calendar** — `PageHeader` with "New event"; the grid inside a `Paper`
  with radius lg and hidden overflow, filling the viewport height below the
  header.
- **Rooms** — cards with a room avatar (initials of the name), name at 500,
  member count as a badge, description clamped to two lines, Open or Join.
  Empty state: "No rooms yet." / "Create the first one." with the action
  "Start a room", which opens the same modal as "New room".
- **Room** — `PageHeader` with the "All rooms" back link, description, and
  the Join / Leave / Edit / Delete actions. Below, on `md` and up, chat on the
  left (grows) and Members in a 320px `Paper` on the right; stacked below
  `md`. Messages: avatar, author name at 500 (the accent when mine), time xs
  dimmed, body; consecutive messages from the same author within five
  minutes share one header. Composer: input plus a `Send` button.
- **Settings** — three `Paper` sections with `h3` titles: Appearance
  (scheme, then palette), Time (time zone), Notifications (three switches);
  Save right-aligned below. The palette `Select` shows three swatches of
  each palette beside its name — the canvas, surface-2 and the accent of
  that palette in the current scheme — and applies the choice as it is
  picked, before Save, because a colour set cannot be judged from a word.
  Save stores it; leaving without saving restores the account's palette.
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
  `Delete`, `Edit`, `Remove`, `Leave`, `Join`, `Send`, `Add a task` (tasks
  empty state), `Start a room` (rooms empty state), `Search` (sidebar, opens
  the palette; its name ends in the shortcut, "Search ⌘K"), and each task's
  title (the inline-rename button).
- Dialogs: `Command palette` (open only), `New task`, `Edit task`,
  `Delete event`.
- Progress bars (skeletons, present only while loading): `Loading tasks`,
  `Loading streak`, `Loading settings`, `Loading rooms`, `Loading room`,
  `Loading members`.
- Images: the week row, `<n> of the last 7 days in the current streak`
  (exact).
- Placeholders: `Search or jump to…` (the palette's search).
- Group headers: rows whose text is the label then the count — `Overdue`,
  `Today`, `This week`, `Later`, `No date`, `Completed`.
- Status: the streak chip's live region, "`+<n>` points" after a completion.
- Labels: `Name`, `Email`, `Password` (textbox role), `Title`, `Priority`
  (combobox), `Theme` (combobox, options `light`/`dark`/`system`), `Palette`
  (combobox, options `Enjazi`/`Nord`/`Solarized`/`Dracula`), `Time zone`
  (combobox), `Room messages`, `Disabled`, `Message`, `Search users`,
  `Complete <task title>` (the row checkbox), `Task title` (the inline-rename
  input, present only while renaming).
- **Names are substrings.** Playwright matches a name as a case-insensitive
  substring unless a test says `exact`, within one kind of query:
  `getByRole` compares elements of that role, `getByLabel` every label and
  `aria-label`, `getByText` visible text. A new element must not match a
  query an existing test makes on the same page — which is why the empty
  states say "Add a task" and "Start a room" rather than "Create task" or
  "New room". The command palette's actions exist only while it is open.
- Text: `Signed in as <email>.`, `No tasks here.`, `No messages yet.`,
  `Settings saved.`, `Done` (exact, the filter), `0-day streak`,
  `1-day streak, completed today`, `Longest 1 · 10 points`, `All` (exact,
  the filter), `Add your first task to start a streak.`, priority label
  text (`High`) inside the task row, role text (`Admin`, `Member`) inside the
  member row.
- Structure: task rows and member rows are `Table` rows (`role=row`); room
  cards are Mantine `Card` (`.mantine-Card-root`) containing the Join button
  or Open link; the sidebar marker is `.mantine-FloatingIndicator-root`
  inside `role=navigation`, measured once it has `data-initialized`; a
  Spotlight action carries `data-selected` when the keyboard selects it; chat messages carry `data-testid="message"`; confirm dialogs
  are `role=dialog` named by their title (`Delete event`); the `html`
  element carries `data-mantine-color-scheme` and `data-enjazi-palette`.

## Verification — `scripts/verify-phase-7.sh`

1. No hex colour outside `src/theme/` and `src/calendar/mantine-bridge.css`;
   no `fontFamily` or px `fontSize` in a `.tsx` file.
2. Everything `scripts/verify-phase-5.sh` checks: generated client current,
   typecheck, lint, build, no `fetch` outside `src/api`, no file over 200
   lines, and the full browser suite against the real API. The suite
   includes `e2e/theme.spec.ts`, which sets the account to each scheme in
   turn and checks that every screen paints on that scheme's canvas, in
   Inter, with an `h1`, and without a page error.

## Verification — `scripts/verify-phase-8.sh`

1. No millisecond literal in a `.ts`, `.tsx` or `.css` file outside
   `src/theme/`, and no numeric `duration`-named prop or option there
   either.
2. Everything `scripts/verify-phase-7.sh` checks, whose suite now includes
   the Phase 8 browser tests: a tick shows before its request answers and
   reverts when it fails, delete and rename the same; the shortcuts and the
   palette navigate; the groups, the empty-state action and the skeleton
   render; the points moment appears; and reduced motion zeroes the
   durations.

## Verification — `scripts/verify-phase-9.sh`

1. The palette ids the frontend offers and the ones the API accepts are the
   same list, read out of both files rather than repeated in the script.
2. Everything `scripts/verify-phase-8.sh` checks, whose suite now includes
   `e2e/colors.spec.ts`: each palette in each scheme paints its own canvas
   and passes an axe-core colour-contrast check on the dashboard, the tasks
   screen, a room and settings; picking a palette applies it before Save;
   and a reload shows the account's palette without a flash of another one.
