import {
  createTheme,
  DEFAULT_THEME,
  defaultVariantColorsResolver,
  type MantineThemeOverride,
  type VariantColorsResolver,
} from '@mantine/core'
import { components } from './components'
import type { Palette } from './palettes'

// Light scheme only; the resolver sets every shadow to none in dark. Shadows
// are black at low alpha, so they are the same in every palette.
const shadows = {
  xs: '0 1px 2px rgba(0,0,0,.05)',
  sm: '0 1px 3px rgba(0,0,0,.06)',
  md: '0 4px 12px rgba(0,0,0,.08)',
}

// Mantine picks a filled label's colour from the light scheme's primary shade
// in both schemes. Where the dark shade is the pale end of the ramp (Nord,
// Dracula) that puts white on a light fill. Its own per-scheme variable,
// --mantine-primary-color-contrast, is right in both, so accent fills use it.
const variantColorResolver: VariantColorsResolver = (input) => {
  const colors = defaultVariantColorsResolver(input)
  const accent = input.color === undefined || input.color === input.theme.primaryColor
  return input.variant === 'filled' && accent ? { ...colors, color: 'var(--mantine-primary-color-contrast)' } : colors
}

// docs/design.md, expressed as a Mantine theme. Everything but colour is the
// same in every palette; the palette fills the three tuples, the primary
// shade per scheme, and black and white.
export function themeFor(palette: Palette): MantineThemeOverride {
  return createTheme({
    colors: palette.colors,
    primaryColor: 'accent',
    primaryShade: palette.primaryShade,
    // Two palettes' dark primary is the pale end of their accent ramp, which
    // needs a dark label rather than a white one. Mantine decides per fill.
    autoContrast: true,
    variantColorResolver,
    black: palette.black,
    white: palette.white,
    fontFamily: `'Inter Variable', ${DEFAULT_THEME.fontFamily}`,
    fontSizes: { xs: '12px', sm: '13px', md: '14px', lg: '16px', xl: '18px' },
    lineHeights: { xs: '1.4', sm: '1.4', md: '1.5', lg: '1.5', xl: '1.5' },
    // Emphasis is 500 and nothing outside headings reaches 700.
    fontWeights: { regular: '400', medium: '500', bold: '600' },
    headings: {
      fontWeight: '600',
      textWrap: 'balance',
      sizes: {
        h1: { fontSize: '24px', lineHeight: '1.2' },
        h2: { fontSize: '20px', lineHeight: '1.25' },
        h3: { fontSize: '16px', lineHeight: '1.3' },
        h4: { fontSize: '14px', lineHeight: '1.4' },
        h5: { fontSize: '13px', lineHeight: '1.4' },
        h6: { fontSize: '12px', lineHeight: '1.4' },
      },
    },
    radius: { xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px' },
    defaultRadius: 'md',
    spacing: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px' },
    // The spec defines three shadows; lg and xl collapse onto md so raised
    // elements that ask for them (Modal, Notification) stay within the scale.
    shadows: { ...shadows, lg: shadows.md, xl: shadows.md },
    // Mantine's own transitions drop to zero duration under the OS setting.
    respectReducedMotion: true,
    components,
  })
}
