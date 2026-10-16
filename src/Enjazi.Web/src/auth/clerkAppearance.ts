import type { ClerkProviderProps } from '@clerk/react'

// Clerk's sign-in and sign-up components, painted with Mantine's own CSS
// variables. They are variables rather than values, so the components follow
// the palette and the colour scheme with no React state of their own.
//
// The card sits on the canvas like every other card: surface-1, a hairline
// and no shadow. colorShadow transparent removes Clerk's drop shadows. Clerk
// draws its 1px rings from colorBorder at 3-11% alpha, so colorBorder is the
// ink, which lands near the hairline; the hairline itself would vanish.
const linkColour = { color: 'var(--mantine-color-anchor)' }

export const clerkAppearance: ClerkProviderProps['appearance'] = {
  variables: {
    colorPrimary: 'var(--mantine-primary-color-filled)',
    colorPrimaryForeground: 'var(--mantine-primary-color-contrast)',
    colorDanger: 'var(--mantine-color-error)',
    colorSuccess: 'var(--mantine-color-green-text)',
    colorWarning: 'var(--mantine-color-orange-text)',
    colorBackground: 'var(--enjazi-surface-1)',
    colorForeground: 'var(--mantine-color-text)',
    colorMutedForeground: 'var(--mantine-color-dimmed)',
    colorInput: 'var(--enjazi-surface-1)',
    colorInputForeground: 'var(--mantine-color-text)',
    colorBorder: 'var(--mantine-color-text)',
    colorRing: 'var(--mantine-primary-color-filled)',
    colorShadow: 'transparent',
    fontFamily: 'var(--mantine-font-family)',
    borderRadius: 'var(--mantine-radius-md)',
  },
  elements: {
    // Clerk lays a white-to-clear gradient and an inset highlight over the
    // primary button; the design has flat fills only.
    // Clerk's own rules outrank these, hence !important.
    formButtonPrimary: { boxShadow: 'none !important', '&::after': { backgroundImage: 'none !important' } },
    socialButtonsBlockButton: { boxShadow: '0 0 0 1px var(--mantine-color-default-border) !important' },
    footer: { background: 'var(--enjazi-surface-2)' },
    // Clerk colours links with colorPrimary, which in the light scheme is a
    // button shade, not a text one. The anchor colour is the readable shade.
    footerActionLink: linkColour,
    formFieldAction: linkColour,
    formResendCodeLink: linkColour,
    identityPreviewEditButton: linkColour,
  },
}
