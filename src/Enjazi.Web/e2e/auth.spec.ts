import { expect, test } from '@playwright/test'

// The Phase 4 check from docs/plan.md: login, protected-route redirect and
// logout against the running API. Each run registers its own account so it
// never depends on existing data.
const password = 'correct-horse-battery-staple'
const email = `phase4-${Date.now()}@example.test`

test('a visitor sees the landing page on / and can navigate to register', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/')
  await expect(
    page.getByRole('heading', { name: 'Tasks, calendar, streaks, and collaborative rooms — unified.' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Get started for free' }).first().click()
  await expect(page).toHaveURL('/register')
})

test('a visitor is redirected to login, and returned after signing in', async ({ page }) => {
  await page.goto('/tasks')
  await expect(page).toHaveURL('/login')

  await page.getByRole('link', { name: 'Register' }).click()
  await expect(page).toHaveURL('/register')
  await page.getByLabel('Name').fill('Phase Four')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByText(`Signed in as ${email}.`)).toBeVisible()
})

test('logout ends the session', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL('/')

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL('/login')

  // The cookie is gone, not merely the client state: a fresh load of a
  // protected route asks the API and is redirected again.
  await page.goto('/tasks')
  await expect(page).toHaveURL('/login')
})

test('a wrong password stays on the login page with a message', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill('not-the-password')
  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(page.getByText('Wrong email or password')).toBeVisible()
  await expect(page).toHaveURL('/login')
})

test('a dropped cookie is noticed on the next load', async ({ page, context }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password' }).fill(password)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page).toHaveURL('/')

  await page.goto('/tasks')

  // Expire the session behind the app's back. The protected route asks the
  // API on load rather than trusting anything cached in the browser.
  await context.clearCookies()
  await page.reload()
  await expect(page).toHaveURL('/login')
})
