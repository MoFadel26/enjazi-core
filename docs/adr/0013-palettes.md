# ADR-0013: Colour palettes

**Status:** accepted
**Date:** 2026-09-26

## Context

The design system has one accent and one pair of ladders: Linear's dark and
Cal.com's light, decided in ADR-0011. Colour is the one part of a visual
system a user has an opinion about, and the app already stores an appearance
preference — the scheme — so the shape for a second one exists.

Phase 9 adds four named palettes and the setting that picks one. Nothing
else about the system changes: structure, type, space, radius and motion are
fixed for the whole app. `docs/design.md` ("Colour") holds the values.

The mechanisms, stated before the decisions:

1. **Mantine derives every colour variable from the theme object.**
   `theme.colors` holds ten-shade tuples; `primaryColor` names one;
   `primaryShade` may differ per scheme; `autoContrast` with
   `luminanceThreshold` decides whether a filled element's label is
   `theme.black` or white. `MantineProvider` writes one `<style>` element of
   CSS variables from all of that, plus whatever `cssVariablesResolver`
   returns. Hand it a different theme object and it rewrites that element:
   a palette change is a re-render, not a reload.
2. **Some of those variables are fixed to an index, not to the primary
   shade.** In `get-css-color-variables`, the dark scheme's
   `--mantine-color-<c>-text` is shade 4 and `-light-color` is shade 0; the
   light scheme's `-text` is the primary shade and `-light-color` is shade
   9. An `Anchor`, a subtle `ActionIcon` and `c="red"` all read one of
   those. So which shade is readable as text is not a free choice: the
   palette has to put a readable colour at the index Mantine will use.
3. **The settings row is one jsonb column shaped by C#.** `SettingsData` is
   deserialised into a class with property defaults, so a property added to
   it appears, with its default, in the response for every row written
   before it existed. Adding a setting needs no migration — only the
   contract, the validation and the client.
4. **Mantine applies the colour scheme before React renders.** It keeps the
   choice in `localStorage` and sets `data-mantine-color-scheme` on `html`
   from a script, which is why the scheme does not flash on load.
   `ColorSchemeSync` then lets the account's answer win once it arrives. A
   palette read only from the API would paint one palette and then another,
   one round trip later.
5. **axe-core measures contrast in the real page.** It resolves the
   composited colour behind text, including a translucent tint over a
   surface, and reports each pair it finds below the ratio for its size.
   `@axe-core/playwright` injects it into a Playwright page, so the check
   runs against the rendered app rather than against a list of hexes.

## Decisions

### Whole palettes, not a colour picker

A palette is an accent ramp, a dark ladder, a light ladder and five
surfaces. What makes Nord look like Nord is the polar-night canvas, not the
frost accent, so the surfaces have to come with it.

Rejected: **an accent picker** — a hue and Mantine's colour generator. It
cannot hold a contrast guarantee (the user picks yellow, the primary
button's label stops being readable) and it changes the least interesting
part of the screen. Rejected: **a theme marketplace format** (VS Code
themes, base16). They name syntax roles — keyword, string, comment — that do
not map onto an application's surfaces without a translation table per
theme, which is the work this ADR is trying to avoid.

### Four palettes: Enjazi, Nord, Solarized, Dracula

Each is published, recognisable and pulls in a different direction: a cool
blue-gray, a warm sepia, and a high-chroma dark. `enjazi` stays the default
and stays the Phase 7 system, except where the contrast rule moved a value.
Dracula's light scheme is Alucard, its own light counterpart, rather than an
inversion invented here.

### Stored in the account, as a string, next to the scheme

`SettingsData.Palette` defaults to `"enjazi"` and is validated against the
same whitelist the frontend offers. The scheme is already stored this way
and the two settings belong together; a browser that signs in somewhere else
shows the palette the user chose.

Rejected: **an int enum.** The column is jsonb that a person may read in
`psql`, and a number would pin the wire format to a declaration order.
Rejected: **`localStorage` only.** It is the cheapest change and loses the
preference on every new browser, which is exactly the case the scheme
setting already handles.

### One theme per palette, built by a function

`themeFor(palette)` returns the Mantine theme; `resolverFor(palette)`
returns the `--enjazi-*` resolver. `PaletteProvider` renders
`MantineProvider` with both, so a palette change re-renders the app and
Mantine rewrites its variables.

Rejected: **a stylesheet per palette with `[data-palette=…]` overrides.**
Mantine derives about forty variables per colour, per scheme, including
`-filled-hover`, `-outline-hover` and the two `light` values it computes
with `darken` and `alpha`. Writing those by hand for four palettes
duplicates Mantine's logic and goes stale the next time it changes.

### The active palette lives in a store, mirrored to `localStorage`

A four-line external store (`useSyncExternalStore`) holds the id and writes
it to `localStorage`. The first render reads that key, so a returning
browser paints the right palette immediately; `PaletteSync`, rendered inside
the app shell exactly like `ColorSchemeSync`, writes the account's answer
into the store when the settings query resolves, and only when it differs.
Keeping the store outside the query cache is what lets `MantineProvider` sit
above `QueryClientProvider`, so no provider order changes.

### `primaryShade` per scheme, and `autoContrast` on

Nord's and Dracula's mid-ramp accent is too close to their canvas to read as
a button, and too dark for a white label. Their dark-scheme primary is the
pale end of the ramp with a dark label, which is what those palettes do
elsewhere. `autoContrast` picks that label for most components, and a
`variantColorResolver` covers the filled variant, which Mantine gets wrong in
dark (see "What the phase found"). `primaryShade` differs per scheme in
every palette.

### Contrast is computed from each source's tokens

Each token starts as the value the source published and is moved along
lightness only, in Lab, until it clears 4.5:1 against every surface it can
land on — for a placeholder, surface-1, because an input paints its own
background; for the accent as text, the canvas, surface-1 and the accent
tint over surface-1. Hairlines, dots and icons are not text and keep their
values.

This is why the palettes below differ from their published tokens in a few
places, and it fixes three failures that predate the phase and were found
while checking Phase 8: Cal.com's placeholder gray (3.5:1 on white),
Mantine's `red-text` for an overdue date (3.2:1 in light) and Cal.com's
avatar discs (as low as 1.9:1 behind white initials). The four semantic
`-text` variables are overridden per palette and scheme, so a screen keeps
writing `c="red"`.

### Settings applies a palette while it is being picked

The `Select` writes to the store on change, before Save. A colour set cannot
be judged from the word "Solarized", and the whole screen is the preview.
Leaving without saving restores the account's palette, so the live change is
not a silent save.

## What the phase found

**Mantine picks a filled label from the light scheme's shade in both
schemes.** `defaultVariantColorsResolver` and `getContrastColor` call
`parseThemeColor` without a colour scheme, so the label of a filled accent
`Button` is decided against the light primary shade. In Nord and Dracula the
dark primary is the pale end of the ramp, and the button got white text on
it: 1.6:1 and 2.3:1. Mantine's own `--mantine-primary-color-contrast` is
written per scheme and is right in both, so `themeFor` wraps the default
resolver and points filled accent variants at it.

**A palette's `white` is not the avatar initials' white.** Nord, Solarized
and Dracula set `theme.white` to their off-white, and Mantine paints avatar
initials in `theme.white`. The discs were computed against `#ffffff` and
fell to 4.0:1 under Nord's `#eceff4`. `src/theme/avatars.ts` now sets the
initials to `#ffffff` in every palette.

**The label check has to use the label the palette really paints.** Solarized
dark's primary, `#1a78b8`, cleared 4.5:1 against `#ffffff` and not against
Solarized's `#fdf6e3` (4.4:1). It moved to `#1075b4`.

**axe composites opacity.** Task rows fade in with motion, and a row checked
halfway through read as 2.4:1. `e2e/colors.spec.ts` waits until every
element motion is fading has reached full opacity before it runs axe.

**The model snapshot describes the settings JSON.** EF Core's
`ComplexProperty(...).ToJson("data")` puts every `SettingsData` property in
the model snapshot, so `Palette` changes the model. `dotnet ef migrations
has-pending-model-changes` still reports none, and no migration was added:
a property with a default changes no column.

## Consequences

- A palette change re-renders the app from the provider down. It happens on
  a user action, at most once per choice, and Mantine's variables do the
  repaint.
- Four palettes × two schemes is eight surface sets to keep honest. The axe
  check in `e2e/colors.spec.ts` is what keeps them honest; a fifth palette
  is a file and a line in the whitelist, and its contrast is checked the
  same way.
- The `enjazi` palette is no longer byte-identical to Linear's and Cal.com's
  published tokens: the dimmed gray, both placeholders, the light scheme's
  primary shade and the avatar discs moved, each for a measured reason, and
  `docs/design.md` carries the values.
- `SettingsRequest` gains a required field. Any caller that sends settings
  sends the palette too.
