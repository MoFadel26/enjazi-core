import type { Palette } from './types'

// Nord: polar night for the dark surfaces, snow storm for the light ones,
// frost for the accent. Its mid frost is too close to the polar-night canvas
// to read as a button, so the dark primary is the pale end of the ramp.
export const nord: Palette = {
  id: 'nord',
  label: 'Nord',
  primaryShade: { light: 8, dark: 4 },
  black: '#2e3440',
  white: '#eceff4',
  colors: {
    accent: [
      '#eaf2f8',
      '#d8e4ee',
      '#b9cddf',
      '#adc7e1',
      '#a1c1e3',
      '#6e91b5',
      '#5e81ac',
      '#52739a',
      '#466488',
      '#3a5576',
    ],
    dark: [
      '#eceff4',
      '#e5e9f0',
      '#b5bfcf',
      '#9da7b8',
      '#4c566a',
      '#3b4252',
      '#343b49',
      '#2e3440',
      '#434c5e',
      '#55607a',
    ],
    gray: [
      '#e5e9f0',
      '#dee3ed',
      '#d8dee9',
      '#cdd5e2',
      '#c2ccdc',
      '#677285',
      '#4c566a',
      '#434c5e',
      '#3b4252',
      '#2e3440',
    ],
  },
  schemes: {
    light: {
      surface1: '#f9fafc',
      surface2: '#e5e9f0',
      surface3: '#d8dee9',
      raised: '#f9fafc',
      accentTint: 'rgba(94, 129, 172, 0.14)',
      text: {
        red: '#be1c22',
        green: '#007026',
        orange: '#b82900',
        yellow: '#a54200',
      },
    },
    dark: {
      surface1: '#343b49',
      surface2: '#3b4252',
      surface3: '#434c5e',
      raised: '#3b4252',
      accentTint: 'rgba(94, 129, 172, 0.18)',
      text: {
        red: '#ffa8a8',
        green: '#69db7c',
        orange: '#ffc078',
        yellow: '#fab005',
      },
    },
  },
}
