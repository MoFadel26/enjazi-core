import type { Palette } from './types'

// Linear's dark scheme and Cal.com's light one, lavender accent: the Phase 7
// system, with the four values the contrast rule moved. docs/design.md.
export const enjazi: Palette = {
  id: 'enjazi',
  label: 'Enjazi',
  primaryShade: { light: 7, dark: 6 },
  black: '#111111',
  white: '#ffffff',
  colors: {
    accent: [
      '#eef0fb',
      '#dfe3f8',
      '#c5cbf1',
      '#a8b1ea',
      '#8b96e3',
      '#7480da',
      '#5e6ad2',
      '#5560bd',
      '#47509e',
      '#383f7e',
    ],
    dark: [
      '#f7f8f8',
      '#d0d6e0',
      '#8a8f98',
      '#797d84',
      '#23252a',
      '#141516',
      '#0f1011',
      '#010102',
      '#18191a',
      '#191a1b',
    ],
    gray: [
      '#f8f9fa',
      '#f3f4f6',
      '#eff1f3',
      '#eaecef',
      '#e5e7eb',
      '#757575',
      '#676e7c',
      '#4e5766',
      '#374151',
      '#111111',
    ],
  },
  schemes: {
    light: {
      surface1: '#ffffff',
      surface2: '#f8f9fa',
      surface3: '#f3f4f6',
      raised: '#ffffff',
      accentTint: 'rgba(94, 106, 210, 0.08)',
      text: {
        red: '#c92a2a',
        green: '#1d7f34',
        orange: '#ca3a00',
        yellow: '#b65000',
      },
    },
    dark: {
      surface1: '#0f1011',
      surface2: '#141516',
      surface3: '#18191a',
      raised: '#18191a',
      accentTint: 'rgba(94, 106, 210, 0.14)',
      text: {
        red: '#fa5252',
        green: '#2f9e44',
        orange: '#e8590c',
        yellow: '#e67700',
      },
    },
  },
}
