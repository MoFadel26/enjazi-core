# ADR-0018: Phosphor icons, drawn through one component

**Status:** accepted
**Date:** 2026-10-16

## Context

ADR-0011 chose `@tabler/icons-react`. Every call site set its own size and
stroke, so the app drew icons at 10, 14, 16, 18 and 20px, and nothing marked
the active sidebar item but its colour. The request was one set across the
whole app, one weight by default, a filled weight only for active states,
and three sizes set in one place.

The mechanisms, stated before the decisions:

1. **Phosphor draws weights, not strokes.** Each glyph ships six weights
   (`thin`, `light`, `regular`, `bold`, `fill`, `duotone`) as separate
   paths, chosen by the `weight` prop. A filled glyph is a different shape,
   not a thicker line, so "active" reads at a glance.
2. **Phosphor paints with `currentColor`.** An icon takes the colour of the
   text around it unless given one, so a muted nav link has a muted icon and
   the active link's accent reaches its icon without a prop.
3. **Each glyph is its own module.** `@phosphor-icons/react` re-exports
   every glyph from one barrel, and the bundler drops the ones not
   imported: the production build holds only the glyphs the app uses.
   Version 2.1 names them `<Name>Icon` (`FireIcon`); the bare names are
   deprecated.

## Decisions

### One component, `src/ui/Icon.tsx`

Every icon is `<Icon icon={FireIcon} size="text" active />`. The component
holds the three sizes — `text` 16px (in a line of text or an input),
`control` 20px (nav items and buttons, the default), `feature` 24px (feature
cards) — and the weight: `regular`, or `fill` when `active`. It sets
`aria-hidden`, since every icon sits beside a label or inside a control
with an `aria-label`. No call site passes a pixel size, a weight or a
colour.

### Fill marks the active item only

The sidebar's active link and the landing preview's active mock link are
filled. A done task in the landing preview is a filled check circle, the
same idea: the selected state. Nothing else is filled.

### Colour comes from the text

Icons have no colour of their own. Where the accent already applied — the
active nav link, the streak flame, the feature cards' tinted tiles — it
still does, through the parent's colour.

## Rejected alternatives

- **Keeping Tabler with a wrapper.** It fixes the sizes but has no filled
  weight for most glyphs, so "active" would still be colour alone.
- **Lucide.** Stroke-only like Tabler; no fill weight.
- **A size per call site, as before.** That is how the app reached five
  sizes.

## Consequences

- `docs/design.md`, "Icons", lists the sizes and where each is used.
- `@tabler/icons-react` is removed from `package.json`.
- The package's main entry re-exports every glyph in all six weights. The
  production build drops the unused ones, but the dev server loads all of
  it on each page load, which made every navigation about half a second
  slower and pushed `e2e/colors.spec.ts` past its time limit.
  `src/ui/icons.ts` imports each glyph from its own module
  (`@phosphor-icons/react/dist/csr/<Name>`) and re-exports it, and the
  `no-restricted-imports` rule in `.oxlintrc.json` keeps every other file
  importing from there.
- ADR-0011's choice of Tabler is superseded; its other decisions stand.
