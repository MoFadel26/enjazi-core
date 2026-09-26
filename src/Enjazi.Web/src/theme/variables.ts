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
const scheme = (colors: SchemeColors) => ({
  '--enjazi-surface-1': colors.surface1,
  '--enjazi-surface-2': colors.surface2,
  '--enjazi-surface-3': colors.surface3,
  '--enjazi-surface-raised': colors.raised,
  '--enjazi-accent-tint': colors.accentTint,
  '--mantine-color-red-text': colors.text.red,
  '--mantine-color-green-text': colors.text.green,
  '--mantine-color-orange-text': colors.text.orange,
  '--mantine-color-yellow-text': colors.text.yellow,
})

// The fast step and the easing are for CSS colour transitions and are the same
// in both schemes and every palette.
export function resolverFor(palette: Palette): CSSVariablesResolver {
  return () => ({
    variables: {
      '--enjazi-duration-fast': `${durations.fast}ms`,
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
