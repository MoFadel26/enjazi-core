import type { CSSVariablesResolver } from '@mantine/core'
import { durations, easing } from './motion'
import { surfaces } from './palette'

// Mantine paints Paper, Card, Modal and AppShell panels with --mantine-color-body.
// These variables give the theme a surface ladder above the canvas per scheme.
// The fast step and the easing are for CSS colour transitions and are the
// same in both.
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {
    '--enjazi-duration-fast': `${durations.fast}ms`,
    '--enjazi-ease': easing,
  },
  light: {
    '--enjazi-surface-1': surfaces.light.surface1,
    '--enjazi-surface-2': surfaces.light.surface2,
    '--enjazi-surface-3': surfaces.light.surface3,
    '--enjazi-surface-raised': surfaces.light.raised,
    '--enjazi-accent-tint': surfaces.light.accentTint,
  },
  dark: {
    '--enjazi-surface-1': surfaces.dark.surface1,
    '--enjazi-surface-2': surfaces.dark.surface2,
    '--enjazi-surface-3': surfaces.dark.surface3,
    '--enjazi-surface-raised': surfaces.dark.raised,
    '--enjazi-accent-tint': surfaces.dark.accentTint,
    // Dark mode has no shadows; hierarchy comes from the surfaces alone.
    '--mantine-shadow-xs': 'none',
    '--mantine-shadow-sm': 'none',
    '--mantine-shadow-md': 'none',
    '--mantine-shadow-lg': 'none',
    '--mantine-shadow-xl': 'none',
  },
})
