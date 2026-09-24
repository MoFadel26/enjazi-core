import type { MantineColorsTuple } from '@mantine/core'

// Every raw colour in the design system. docs/design.md is the source; this is
// the only .ts/.tsx file allowed to hold a hex literal.

// Linear's accent. Shade 6 is primary in both schemes.
export const lavender: MantineColorsTuple = [
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
]

// Linear's dark ladder, ordered so Mantine's fixed indexes land on the right
// token (0 text, 2 dimmed, 4 border, 5 hover, 6 default, 7 body).
export const dark: MantineColorsTuple = [
  '#f7f8f8',
  '#d0d6e0',
  '#8a8f98',
  '#62666d',
  '#23252a',
  '#141516',
  '#0f1011',
  '#010102',
  '#18191a',
  '#191a1b',
]

// Cal.com's light neutrals.
export const gray: MantineColorsTuple = [
  '#f8f9fa',
  '#f3f4f6',
  '#eff1f3',
  '#eaecef',
  '#e5e7eb',
  '#898989',
  '#6b7280',
  '#4b5563',
  '#374151',
  '#111111',
]

export const black = '#111111'
export const white = '#ffffff'

// Cal.com's badge set; the only decorative use of a colour other than lavender.
export const avatarPastels = ['#fb923c', '#ec4899', '#8b5cf6', '#34d399', '#5e6ad2']

// Scheme-specific surfaces exposed as --enjazi-* through the resolver.
export const surfaces = {
  light: {
    surface1: '#ffffff',
    surface2: '#f8f9fa',
    surface3: '#f3f4f6',
    raised: '#ffffff',
    accentTint: 'rgba(94,106,210,.08)',
  },
  dark: {
    surface1: '#0f1011',
    surface2: '#141516',
    surface3: '#18191a',
    raised: '#18191a',
    accentTint: 'rgba(94,106,210,.14)',
  },
}

// Light scheme only; the resolver sets every shadow to none in dark.
export const shadows = {
  xs: '0 1px 2px rgba(0,0,0,.05)',
  sm: '0 1px 3px rgba(0,0,0,.06)',
  md: '0 4px 12px rgba(0,0,0,.08)',
}
