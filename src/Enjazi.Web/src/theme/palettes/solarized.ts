import type { Palette } from './types'

// Solarized: base03 to base3, blue accent. The dark text steps sit close
// together because Solarized's own body text does; each still clears 4.5:1.
export const solarized: Palette = {
  id: 'solarized',
  label: 'Solarized',
  primaryShade: { light: 8, dark: 7 },
  black: '#002b36',
  white: '#fdf6e3',
  colors: {
    accent: [
      '#e8f4fd',
      '#cfe7f8',
      '#a5d2f0',
      '#79bce8',
      '#62b0e9',
      '#3d95d6',
      '#268bd2',
      '#1075b4',
      '#14669d',
      '#0e5583',
    ],
    dark: [
      '#9eacac',
      '#9bacaf',
      '#9aadaf',
      '#8198a0',
      '#2e4f58',
      '#073642',
      '#03303c',
      '#002b36',
      '#1c424d',
      '#274953',
    ],
    gray: [
      '#f5efdc',
      '#eee8d5',
      '#e6dfcb',
      '#dfd9c3',
      '#d9d2bc',
      '#5f7375',
      '#546a71',
      '#304f59',
      '#073642',
      '#002b36',
    ],
  },
  schemes: {
    light: {
      surface1: '#fdf6e3',
      surface2: '#f4eedb',
      surface3: '#eee8d5',
      raised: '#fdf6e3',
      accentTint: 'rgba(38, 139, 210, 0.12)',
      text: {
        red: '#c62728',
        green: '#0e772d',
        orange: '#c13200',
        yellow: '#ac4800',
      },
    },
    dark: {
      surface1: '#03303c',
      surface2: '#073642',
      surface3: '#1c424d',
      raised: '#1c424d',
      accentTint: 'rgba(38, 139, 210, 0.16)',
      text: {
        red: '#ff8787',
        green: '#51cf66',
        orange: '#ff922b',
        yellow: '#f59f00',
      },
    },
  },
}
