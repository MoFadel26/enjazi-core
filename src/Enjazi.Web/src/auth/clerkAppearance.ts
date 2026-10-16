import type { ClerkProviderProps } from '@clerk/react'

// Clerk's sign-in and sign-up components, painted with Mantine's own CSS
// variables. They are variables rather than values, so the components follow
// the palette and the colour scheme with no React state of their own.
export const clerkAppearance: ClerkProviderProps['appearance'] = {
  variables: {
    colorPrimary: 'var(--mantine-primary-color-filled)',
    colorPrimaryForeground: 'var(--mantine-primary-color-contrast)',
    colorDanger: 'var(--mantine-color-error)',
    colorBackground: 'var(--mantine-color-body)',
    colorForeground: 'var(--mantine-color-text)',
    colorMutedForeground: 'var(--mantine-color-dimmed)',
    colorInput: 'var(--enjazi-surface-1)',
    colorInputForeground: 'var(--mantine-color-text)',
    colorBorder: 'var(--mantine-color-default-border)',
    fontFamily: 'var(--mantine-font-family)',
    borderRadius: 'var(--mantine-radius-md)',
  },
}
