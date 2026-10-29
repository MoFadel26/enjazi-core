import { expect, test } from '@playwright/test'

// Guest mode, ADR-0017: no Clerk account, a temporary one from the API with
// sample data, a banner saying when it goes, and the way back out.
test('"Try as guest" opens the dashboard with sample data and the guest banner', async ({ page }) => {
  await page.goto('/landing')
  await page.getByRole('main').getByRole('button', { name: 'Try as guest' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Trying Enjazi as a guest.')).toBeVisible()
  await expect(page.getByText(/^Guest session — your data is deleted on \w{3} \d{1,2}\. Sign up to keep it\.$/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign up' })).toHaveAttribute('href', '/register')

  // The sample: one overdue task, a three-day streak that includes today,
  // and two events this week.
  await expect(page.getByText('1 overdue')).toBeVisible()
  await expect(page.getByText('3-day streak, completed today')).toBeVisible()
  await expect(page.getByText('Team check-in')).toBeVisible()
  await expect(page.getByText('Lunch with Sam')).toBeVisible()

  // A guest joins rooms but does not create them.
  await page.getByRole('link', { name: 'Rooms', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Rooms' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'New room' })).toHaveCount(0)

  // Leaving drops the session and goes back to the landing page.
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('main').getByRole('button', { name: 'Try as guest' })).toBeVisible()
})

test('a guest whose session the API refuses is sent back to the landing page', async ({ page }) => {
  await page.goto('/landing')
  await page.getByRole('main').getByRole('button', { name: 'Try as guest' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Stands in for an expired guest: every API call is refused from here on.
  await page.route('**/api/**', (route) => route.fulfill({ status: 401, body: '' }))
  await page.getByRole('link', { name: 'Tasks', exact: true }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('main').getByRole('button', { name: 'Try as guest' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('enjazi-guest'))).toBeNull()
})
