import type { Palette } from './types'

// Dracula for the dark scheme and Alucard, its own light counterpart, for the
// light one. Purple accent, pale in the dark scheme so its label reads.
export const dracula: Palette = {
  id: 'dracula',
  label: 'Dracula',
  primaryShade: { light: 8, dark: 4 },
  black: '#1f1f1f',
  white: '#fffbeb',
  colors: {
    accent: [
      '#f4ecff',
      '#e7daff',
      '#d6bffc',
      '#c9a8fa',
      '#bf95fb',
      '#a97ef0',
      '#9560e4',
      '#7f4ed6',
      '#6b3fc4',
      '#5932ab',
    ],
    dark: [
      '#f8f8f2',
      '#c8cfdb',
      '#a7b0d0',
      '#9099bd',
      '#44475a',
      '#343746',
      '#2e303e',
      '#282a36',
      '#393c4c',
      '#4d5169',
    ],
    gray: [
      '#f7f2e0',
      '#f2edd9',
      '#efe9d5',
      '#e6dfc7',
      '#ddd5ba',
      '#7a7458',
      '#6c664b',
      '#4f4c3f',
      '#333333',
      '#1f1f1f',
    ],
  },
  schemes: {
    light: {
      surface1: '#fffdf7',
      surface2: '#f6f1df',
      surface3: '#efe9d5',
      raised: '#fffdf7',
      accentTint: 'rgba(149, 96, 228, 0.12)',
      text: {
        red: '#c62728',
        green: '#11782e',
        orange: '#c13200',
        yellow: '#ae4900',
      },
    },
    dark: {
      surface1: '#2e303e',
      surface2: '#343746',
      surface3: '#393c4c',
      raised: '#343746',
      accentTint: 'rgba(149, 96, 228, 0.17)',
      text: {
        red: '#ff8787',
        green: '#40c057',
        orange: '#ff922b',
        yellow: '#f59f00',
      },
    },
  },
}
