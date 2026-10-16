# ADR-0016: Enjazi's own palette — warm neutrals, one amber accent

**Status:** accepted
**Date:** 2026-10-16

## Context

ADR-0011 took the `enjazi` palette from Linear (dark) and Cal.com (light):
a lavender accent on a near-black canvas and a white one. The result read as
a generic indigo-on-black template rather than as this product. The aim of
this change is an identity of its own that stays as quiet as before.
Structure, type, space and motion do not change, and neither do the other
three palettes (ADR-0013).

The mechanisms, stated before the decisions:

1. **Mantine picks a filled label by luminance.** With `autoContrast` on,
   a fill whose relative luminance is above `theme.luminanceThreshold`
   (default 0.3) gets `theme.black`, otherwise white. The JavaScript path
   (`getContrastColor`, used by `Checkbox`, `ThemeIcon` and the variant
   resolver) reads the light scheme's primary shade in both schemes;
   `--mantine-primary-color-contrast` is written per scheme.
2. **Mantine fixes which shade is text.** In the light scheme
   `--mantine-color-<c>-text` and `--mantine-color-anchor` are the primary
   shade; in dark both are shade 4. A palette cannot pick a different text
   shade through the theme object, only by overriding the variables in the
   `cssVariablesResolver`, which already does this for `red`, `green`,
   `orange` and `yellow`.
3. **Clerk derives its look from a few variables.** `colorPrimary` fills the
   button and colours links; `colorBorder` is drawn at 3–11% alpha as 1px
   rings; `colorShadow` tints its drop shadows. Its primary button carries a
   gradient overlay on `::after` that no variable turns off; the
   `elements` map can.

## Decisions

### Amber, with a near-black label in both schemes

The accent is `#f59e0b`. White on it is 2.1:1, so the label is near-black
(`#1c1a17`), 8.1:1. In the light scheme `#f59e0b` stands only 2.0:1 off the
`#faf9f7` canvas, under the 3:1 a control needs, so the light primary is
one shade deeper, `#d97706`: 3.0:1 off the canvas and 5.5:1 for its label.

`#d97706` has a luminance of 0.28. At Mantine's 0.3 it would get a white
label at 3.2:1. `luminanceThreshold` is 0.25. No other fill the app paints
with a label lies between 0.25 and 0.3 in any palette, so nothing else
changes; the fills that do lie there (Mantine's `green-8`, `orange-7`,
`cyan-7`) carry no label in this app.

### Accent text is a separate shade

A shade dark enough to read as text on white (4.5:1) is too dark to carry a
near-black label. So in light the button is shade 7 and links, the
accent's `-text` and an own message's author name are shade 9, `#a64b07`,
5.5:1 on the canvas. A scheme sets this through an optional `text.accent`;
only Enjazi's light scheme has one. In dark Mantine's own shade 4,
`#fbbf24`, already reads at 11:1.

### Warm neutrals instead of blue-grey

Dark canvas `#121110`, cards `#1a1917`, hairline `#2a2826`, ink `#edebe8`.
Light canvas `#faf9f7`, white cards, hairline `#e7e5e2`, ink `#1c1a17`. The
canvas moves off pure black so the cards a step above it stay visible
without a shadow.

### The streak is the accent; semantic colours stay separate

The flame, the run's dots and the points moment move from `orange` to the
accent: the streak is the product's signature, and amber next to orange read
as two near-identical colours. `orange` stays for the warning, `green` for
done and success, `red` for errors, so none of them can be mistaken for the
brand. Status pills use their meaning's colour, never the accent.

### Flat fills, one radius

No gradients anywhere, including Clerk's button overlay, removed through
`elements`. Cards and modals move from `lg` to `md`, so every box shares one
radius. Clerk's drop shadows go (`colorShadow` transparent), and
`colorBorder` is the ink, because Clerk draws it at a few percent alpha and
the hairline itself would vanish.

## Rejected alternatives

- **White labels on a darker amber.** White needs 4.5:1, which takes amber
  down to `#b45309` and below: a brown, not the saffron the identity is
  built on.
- **Overriding `--mantine-primary-color-contrast` instead of the
  threshold.** It fixes buttons but not `Checkbox` or `ThemeIcon`, which
  compute their label in JavaScript from the light shade.
- **Keeping the streak orange.** Two warm hues of nearly the same lightness
  on one card, with only one of them meaning "warning".
- **Changing all four palettes.** Nord, Solarized and Dracula are published
  systems a user picks on purpose; the request was Enjazi's identity.

## Consequences

- `docs/design.md` carries the values and the measured ratios;
  `e2e/colors.spec.ts` and `e2e/theme.spec.ts` check the new canvases, and
  the axe check covers the contrast.
- A palette whose accent is too pale for text sets `text.accent` rather than
  moving its primary shade.
- ADR-0011's "Linear decides accent" no longer holds for `enjazi`; its
  structural decisions stand.
