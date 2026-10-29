import { setupClerkTestingToken } from '@clerk/testing/playwright'
import { expect, type Page, test } from '@playwright/test'
import { ensureClerkUser, password, registerAndSignIn, testEmailSuffix } from './session.js'

// The Phase 4 check from docs/plan.md, against Clerk: the sign-in form,
// protected-route redirect and logout. The form is Clerk's (ADR-0015), so the
// labels below are Clerk's too.
const email = `phase4-${Date.now()}${testEmailSuffix}`

test.beforeAll(() => ensureClerkUser(email, password, 'Phase Four'))

test.beforeEach(({ page }) => setupClerkTestingToken({ page }))

// Clerk's two-step form: the address, then the password. A sign-in from a
// browser Clerk has not seen may ask for an emailed code; a +clerk_test
// address takes 424242.
async function signInWithForm(page: Page, secret: string) {
  await page.getByLabel('Email address').fill(email)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('Password', { exact: true }).fill(secret)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
}

test('a visitor sees the landing page on / and can navigate to register', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Tasks, calendar and streaks in one quiet workspace.' })).toBeVisible()
  await page.getByRole('link', { name: 'Get started free' }).first().click()
  await expect(page).toHaveURL('/register')
})

test('a visitor is redirected to login, and returned after signing in', async ({ page }) => {
  await page.goto('/tasks')
  await expect(page).toHaveURL('/login?redirect_url=%2Ftasks')

  await signInWithForm(page, password)
  const code = page.getByLabel(/verification code/i)
  if (await code.isVisible({ timeout: 2000 }).catch(() => false)) await code.fill('424242')

  await expect(page).toHaveURL('/tasks')
})

test('logout ends the session', async ({ page }) => {
  await registerAndSignIn(page, 'logout')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login/)

  // The Clerk session is gone, not merely the client state.
  await page.goto('/tasks')
  await expect(page).toHaveURL(/\/login/)
})

test('a wrong password stays on the login page with a message', async ({ page }) => {
  await page.goto('/login')
  await signInWithForm(page, 'not-the-password')

  // Clerk shows the message under the field and repeats it in a live region.
  await expect(page.getByText(/password is incorrect/i).first()).toBeVisible()
  await expect(page).toHaveURL(/\/login/)
})

test('a cleared session is noticed on the next load', async ({ page, context }) => {
  await registerAndSignIn(page, 'cleared')
  await page.goto('/tasks')
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()

  // Clerk's session lives in cookies. Without them, a fresh load has no
  // session and the protected route redirects.
  await context.clearCookies()
  await page.reload()
  await expect(page).toHaveURL(/\/login/)
})
