import type { CSSVariablesResolver } from '@mantine/core'
import { durations, easing } from './motion'
import type { Palette, SchemeColors } from './palettes'

// Mantine paints Paper, Card, Modal and AppShell panels with
// --mantine-color-body. These variables give the theme a surface ladder above
// the canvas per scheme.
//
// The four <colour>-text variables are Mantine's own, overridden: it sets them
// to the filled shade in light and shade 4 in dark, and neither clears 4.5:1
// on every surface. Overriding them here means a screen keeps writing c="red".
// A palette whose filled accent is too pale for text overrides the accent's
// -text and the anchor colour the same way, and one with its own primary
// states overrides Mantine's label and hover for the primary fill.
const scheme = (colors: SchemeColors) => ({
  '--enjazi-surface-1': colors.surface1,
  '--enjazi-surface-2': colors.surface2,
  '--enjazi-surface-3': colors.surface3,
  '--enjazi-surface-raised': colors.raised,
  '--enjazi-accent-tint': colors.accentTint,
  '--enjazi-control-border': colors.control.border,
  '--enjazi-control-hover': colors.control.hover,
  '--mantine-color-red-text': colors.text.red,
  '--mantine-color-green-text': colors.text.green,
  '--mantine-color-orange-text': colors.text.orange,
  '--mantine-color-yellow-text': colors.text.yellow,
  ...(colors.text.accent && {
    '--mantine-color-accent-text': colors.text.accent,
    '--mantine-color-anchor': colors.text.accent,
  }),
  ...(colors.primary && {
    '--mantine-primary-color-contrast': colors.primary.label,
    '--mantine-primary-color-filled-hover': colors.primary.hover,
    '--mantine-color-accent-filled-hover': colors.primary.hover,
    '--enjazi-primary-active': colors.primary.active,
  }),
})

// The fast step and the easing are for CSS colour transitions, the theme step
// for the theme cross-fade. All are the same in both schemes and every palette.
export function resolverFor(palette: Palette): CSSVariablesResolver {
  return () => ({
    variables: {
      '--enjazi-duration-fast': `${durations.fast}ms`,
      '--enjazi-duration-theme': `${durations.theme}ms`,
      '--enjazi-ease': easing,
    },
    light: scheme(palette.schemes.light),
    dark: {
      ...scheme(palette.schemes.dark),
      // Dark mode has no shadows; hierarchy comes from the surfaces alone.
      '--mantine-shadow-xs': 'none',
      '--mantine-shadow-sm': 'none',
      '--mantine-shadow-md': 'none',
      '--mantine-shadow-lg': 'none',
      '--mantine-shadow-xl': 'none',
    },
  })
}
