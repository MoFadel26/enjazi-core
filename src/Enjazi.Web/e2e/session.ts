import { createClerkClient } from '@clerk/backend'
import { clerk } from '@clerk/testing/playwright'
import type { Page } from '@playwright/test'

// Accounts live in Clerk, created through its Backend API with the secret key
// from .env.test.local. A +clerk_test address sends no mail and takes 424242
// as every verification code.
const clerkApi = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export const password = 'correct-horse-battery-staple'
export const testEmailSuffix = '+clerk_test@example.com'

// The account scripts/verify-phase-5.sh passes to the API as
// Bootstrap:AdminEmail, so it is an admin from its first request.
export const admin = { email: `phase5-admin${testEmailSuffix}`, password: 'phase5-admin-password' }

declare global {
  interface Window {
    // fetch with the Clerk session token, for specs that call the API from
    // inside the page. Defined by signInAs.
    apiFetch: (input: string, init?: RequestInit) => Promise<Response>
  }
}

// Creates the Clerk user unless the address already has one.
export async function ensureClerkUser(email: string, password: string, displayName: string) {
  const existing = await clerkApi.users.getUserList({ emailAddress: [email] })
  if (existing.data.length > 0) return
  await clerkApi.users.createUser({ emailAddress: [email], password, firstName: displayName, skipPasswordChecks: true })
}

// Signs the page in to Clerk without the form, which auth.spec.ts covers, and
// makes the first API request, which creates the local user.
async function signInAs(page: Page, email: string) {
  await page.addInitScript(() => {
    window.apiFetch = async (input, init) => {
      const token = await window.Clerk.session?.getToken()
      const headers = new Headers(init?.headers)
      if (token) headers.set('Authorization', `Bearer ${token}`)
      return fetch(input, { ...init, headers })
    }
  })
  // Any page that loads Clerk; this one is public.
  await page.goto('/landing')
  await clerk.signIn({ page, emailAddress: email })
  return page.evaluate(async () => {
    const response = await window.apiFetch('/api/auth/me')
    if (!response.ok) throw new Error(`GET /api/auth/me returned ${response.status}`)
    return (await response.json()) as { id: string; email: string; roles: string[] }
  })
}

// A fresh account, signed in.
export async function registerAndSignIn(page: Page, label: string) {
  const email = `phase5-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}${testEmailSuffix}`
  const displayName = `Phase Five ${label}`
  await ensureClerkUser(email, password, displayName)
  const me = await signInAs(page, email)
  return { email, displayName, password, id: me.id }
}

export async function signIn(page: Page, credentials: { email: string; password: string }) {
  await ensureClerkUser(credentials.email, credentials.password, 'Phase Five Admin')
  return signInAs(page, credentials.email)
}

// Every Clerk user these specs made, except the admin, which is kept so its
// local row and role persist between runs.
export async function deleteTestUsers() {
  for (;;) {
    const { data } = await clerkApi.users.getUserList({ query: testEmailSuffix, limit: 100 })
    const doomed = data.filter((user) =>
      user.emailAddresses.every((address) => address.emailAddress !== admin.email && address.emailAddress.endsWith(testEmailSuffix)),
    )
    if (doomed.length === 0) return
    for (const user of doomed) await clerkApi.users.deleteUser(user.id)
  }
}
