import { expect, test } from '@playwright/test'
import { registerAndSignIn } from './session.js'

test('tasks can be created, completed, filtered, edited and deleted', async ({ page }) => {
  await registerAndSignIn(page, 'tasks')
  await page.goto('/tasks')
  await expect(page.getByText('No tasks here.')).toBeVisible()

  await page.getByRole('button', { name: 'New task' }).click()
  await page.getByLabel('Title').fill('Write the Phase 5 tests')
  await page.getByRole('combobox', { name: 'Priority' }).click()
  await page.getByRole('option', { name: 'High' }).click()
  await page.getByRole('button', { name: 'Create' }).click()
  const row = page.getByRole('row').filter({ hasText: 'Write the Phase 5 tests' })
  await expect(row).toBeVisible()
  await expect(row.getByText('High')).toBeVisible()

  // Completing moves it out of Open and into Done.
  await row.getByRole('checkbox').click()
  await expect(page.getByText('No tasks here.')).toBeVisible()
  await page.getByText('Done', { exact: true }).click()
  await expect(row).toBeVisible()

  await row.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Title').fill('Write the Phase 5 tests, again')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Write the Phase 5 tests, again' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('No tasks here.')).toBeVisible()
})

test('an expired session is noticed on the next API call, without a reload', async ({ page, context }) => {
  await registerAndSignIn(page, 'expiry')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Drop the cookie behind the app's back, then navigate client-side. The
  // cached user still says signed in; the tasks request answers 401 and the
  // fetch middleware (ADR-0008) turns that into a redirect.
  await context.clearCookies()
  await page.getByRole('link', { name: 'Tasks', exact: true }).click()
  await expect(page).toHaveURL('/login')
})
