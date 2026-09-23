import { expect, test } from '@playwright/test'
import { registerAndSignIn } from './session.js'

test('settings are saved to the account and the theme is applied', async ({ page }) => {
  await registerAndSignIn(page, 'settings')
  await page.goto('/settings')
  const html = page.locator('html')

  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('system')
  await page.getByRole('combobox', { name: 'Theme' }).click()
  await page.getByRole('option', { name: 'dark' }).click()
  await page.getByRole('combobox', { name: 'Time zone' }).click()
  await page.getByRole('combobox', { name: 'Time zone' }).fill('Asia/Riyadh')
  await page.getByRole('option', { name: 'Asia/Riyadh' }).click()
  await page.getByLabel('Room messages').uncheck()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Settings saved.')).toBeVisible()
  await expect(html).toHaveAttribute('data-mantine-color-scheme', 'dark')

  // The values came back from the server, not from the form.
  await page.reload()
  await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark')
  await expect(page.getByRole('combobox', { name: 'Time zone' })).toHaveValue('Asia/Riyadh')
  await expect(page.getByLabel('Room messages')).not.toBeChecked()
  await expect(html).toHaveAttribute('data-mantine-color-scheme', 'dark')
})
