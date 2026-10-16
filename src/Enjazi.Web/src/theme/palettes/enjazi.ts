import type { Palette } from './types'

// Enjazi's own palette: warm neutrals and one amber accent. The amber fill
// takes a near-black label in both schemes, which is why the light scheme's
// primary is the deeper shade 7 and links there are shade 9: shade 7 reads as
// a button on the off-white canvas but not as text. Shades 5 to 8 are a
// softened amber; the primary lightens one shade on hover and darkens one on
// press, which only a dark label survives. docs/design.md.
export const enjazi: Palette = {
  id: 'enjazi',
  label: 'Enjazi',
  primaryShade: { light: 7, dark: 6 },
  black: '#1c1a17',
  white: '#faf9f7',
  colors: {
    accent: [
      '#fff8e6',
      '#fdedc4',
      '#fbe0a0',
      '#f9cc66',
      '#fbbf24',
      '#edb05a',
      '#e9a23b',
      '#d98e1f',
      '#c27c14',
      '#a64b07',
    ],
    dark: [
      '#edebe8',
      '#d4d0cb',
      '#9c978f',
      '#8c877f',
      '#2a2826',
      '#201f1d',
      '#1a1917',
      '#121110',
      '#262523',
      '#2e2c2a',
    ],
    gray: [
      '#f4f3f0',
      '#f1efec',
      '#eeece9',
      '#ebe9e6',
      '#e7e5e2',
      '#75706a',
      '#6b665f',
      '#57534e',
      '#3a3733',
      '#1c1a17',
    ],
  },
  schemes: {
    light: {
      surface1: '#ffffff',
      surface2: '#f4f3f0',
      surface3: '#eeece9',
      raised: '#ffffff',
      accentTint: 'rgba(245, 158, 11, 0.10)',
      control: { border: '#d6d3ce', hover: '#f2f0ec' },
      primary: { label: '#1a1305', hover: '#e9a23b', active: '#c27c14' },
      text: {
        accent: '#a64b07',
        red: '#bd2424',
        green: '#17722d',
        orange: '#b33a09',
        yellow: '#935805',
      },
    },
    dark: {
      surface1: '#1a1917',
      surface2: '#201f1d',
      surface3: '#262523',
      raised: '#262523',
      accentTint: 'rgba(245, 158, 11, 0.10)',
      control: { border: '#44403c', hover: '#24211f' },
      primary: { label: '#1a1305', hover: '#edb05a', active: '#d98e1f' },
      text: {
        red: '#ff6b6b',
        green: '#40c057',
        orange: '#ff922b',
        yellow: '#fcc419',
      },
    },
  },
}
