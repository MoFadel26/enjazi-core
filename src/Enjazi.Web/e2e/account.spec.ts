import { expect, test } from '@playwright/test'

// Deleting your account from Settings, ADR-0019. Run as a guest, which needs
// no Clerk user; the API tests cover a Clerk account, the rooms that pass on
// and the messages that stay.
test('holding "Delete account" deletes it; letting go early does not', async ({ page }) => {
  await page.goto('/landing')
  await page.getByRole('main').getByRole('button', { name: 'Try as guest' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((name) => name.includes('guest'))
    return key ? (JSON.parse(localStorage.getItem(key) ?? 'null') as { token: string }).token : ''
  })
  const me = () => page.request.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })

  await page.getByRole('link', { name: 'Settings' }).click()
  const button = page.getByRole('button', { name: 'Delete account' })
  await expect(button).toHaveAccessibleDescription('Press and hold for 2 seconds to delete your account.')

  // Half a second, then let go: nothing happens.
  await button.hover()
  await page.mouse.down()
  await expect(page.getByText('Keep holding…')).toBeVisible()
  await page.waitForTimeout(500)
  await page.mouse.up()
  await page.waitForTimeout(2000)
  await expect(page).toHaveURL('/settings')
  expect((await me()).status()).toBe(200)

  // Held from the keyboard for the whole time: the account goes.
  await button.focus()
  await page.keyboard.down('Space')
  await page.waitForTimeout(2300)
  await page.keyboard.up('Space')

  // /landing, or / when a guest request in flight is refused first and the
  // guest session ends the way an expired one does. Both are the landing page.
  await expect(page).toHaveURL(/\/(landing)?$/)
  await expect(page.getByText('Your account was deleted.')).toBeVisible()
  await expect(page.getByRole('main').getByRole('button', { name: 'Try as guest' })).toBeVisible()
  expect((await me()).status()).toBe(401)
})
