import type { Page } from '@playwright/test'

export const password = 'correct-horse-battery-staple'

// The account scripts/verify-phase-5.sh registers and the API promotes through
// Bootstrap:AdminEmail. The password is fixed so the admin test can sign in.
export const admin = { email: 'phase5-admin@example.test', password: 'phase5-admin-password' }

// Registers a fresh account through the API. page.request shares the
// context's cookie jar, so the page is signed in afterwards without touching
// the login form, which auth.spec.ts already covers.
export async function registerAndSignIn(page: Page, label: string) {
  const email = `phase5-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`
  const displayName = `Phase Five ${label}`
  const response = await page.request.post('/api/auth/register', {
    data: { email, displayName, password },
  })
  if (!response.ok()) throw new Error(`register failed: ${response.status()} ${await response.text()}`)
  return { email, displayName, password, id: ((await response.json()) as { id: string }).id }
}

export async function signIn(page: Page, credentials: { email: string; password: string }) {
  const response = await page.request.post('/api/auth/login', { data: credentials })
  if (!response.ok()) throw new Error(`login failed for ${credentials.email}: ${response.status()}`)
  return (await response.json()) as { id: string; roles: string[] }
}
