import { expect, test } from '@playwright/test'
import { registerAndSignIn } from './session.js'

// The Phase 7 check from docs/plan.md: the design system is applied on both
// schemes. Each scheme is chosen through the account's setting, as a user
// would, and then every screen is visited: it must sit on that scheme's
// canvas (Cal.com white, Linear near-black), render in Inter, start with a
// page heading, and raise no page error.
const screens = ['/', '/tasks', '/calendar', '/rooms', '/settings']
const canvas = { light: 'rgb(255, 255, 255)', dark: 'rgb(1, 1, 2)' }

for (const scheme of ['light', 'dark'] as const) {
  test(`every screen renders on the ${scheme} canvas`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))

    await registerAndSignIn(page, `theme-${scheme}`)
    await page.goto('/settings')
    await page.getByRole('combobox', { name: 'Theme' }).click()
    await page.getByRole('option', { name: scheme }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Settings saved.')).toBeVisible()

    for (const path of screens) {
      await page.goto(path)
      await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', scheme)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect
        .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
        .toBe(canvas[scheme])
      await expect.poll(() => page.evaluate(() => document.fonts.check('14px "Inter Variable"'))).toBe(true)
    }

    expect(errors).toEqual([])
  })
}
