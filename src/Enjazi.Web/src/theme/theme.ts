import { createTheme, DEFAULT_THEME } from '@mantine/core'
import { components } from './components'
import { black, dark, gray, lavender, shadows, white } from './palette'

// docs/design.md, expressed as a Mantine theme. Values live here so screens
// only ever reference tokens.
export const theme = createTheme({
  colors: { lavender, dark, gray },
  primaryColor: 'lavender',
  primaryShade: 6,
  black,
  white,
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
  components,
})
