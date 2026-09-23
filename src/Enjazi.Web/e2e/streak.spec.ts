import { expect, test } from '@playwright/test'
import { registerAndSignIn } from './session.js'

// The browser half of the streak check: completing a task shows up on the
// dashboard. Moving the calendar to prove the reset is the API test's job
// (StreakTests in tests/Enjazi.Api.Tests), since a browser cannot skip a day.
test('completing a task starts the streak on the dashboard', async ({ page }) => {
  await registerAndSignIn(page, 'streak')
  await page.goto('/')
  await expect(page.getByText('0-day streak')).toBeVisible()

  await page.getByRole('link', { name: 'Tasks', exact: true }).click()
  await page.getByRole('button', { name: 'New task' }).click()
  await page.getByLabel('Title').fill('Keep the streak')
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByRole('checkbox', { name: 'Complete Keep the streak' }).click()
  await expect(page.getByText('No tasks here.')).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByText('1-day streak, completed today')).toBeVisible()
  await expect(page.getByText('Longest 1 · 10 points')).toBeVisible()
})
