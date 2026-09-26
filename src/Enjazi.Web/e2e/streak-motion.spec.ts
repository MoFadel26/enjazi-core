import { expect, test, type Locator } from '@playwright/test'
import { holdGet, seedTasks } from './helpers.js'
import { registerAndSignIn } from './session.js'

// Phase 8's streak and motion checks (docs/design.md, "Screens", "Motion",
// "Loading"). A real completion drives the week row and the points moment,
// since both are read from the streak query rather than predicted. Reduced
// motion is checked on the computed transition-duration, which is what the
// OS setting changes; a screenshot cannot tell 0s from 0.18s. Skeletons are
// checked by holding the screen's GET.

const transitionDuration = (locator: Locator) => locator.evaluate((element) => getComputedStyle(element).transitionDuration)

test('a completion fills the week row and shows the points gained', async ({ page }) => {
  await registerAndSignIn(page, 'week-row')
  await page.goto('/')
  await expect(page.getByRole('img', { name: '0 of the last 7 days in the current streak', exact: true })).toBeVisible()

  const title = 'Earn the points'
  await seedTasks(page, [{ title }])

  await page.getByRole('link', { name: 'Tasks', exact: true }).click()
  await page.getByRole('checkbox', { name: `Complete ${title}` }).click()
  // The delta comes from the streak refetch after the PUT, not from the tick.
  await expect(page.getByRole('status')).toHaveText('+10 points')

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByRole('img', { name: '1 of the last 7 days in the current streak', exact: true })).toBeVisible()
  await expect(page.getByText('1-day streak, completed today')).toBeVisible()
  await expect(page.getByText('Longest 1 · 10 points')).toBeVisible()
})

// Both run on durations.base, 0.18s; under the OS setting Mantine runs them at zero.
for (const { reducedMotion, duration } of [
  { reducedMotion: 'no-preference', duration: '0.18s' },
  { reducedMotion: 'reduce', duration: '0s' },
] as const) {
  test(`with reducedMotion ${reducedMotion} the modal and the nav marker run for ${duration}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await registerAndSignIn(page, `motion-${reducedMotion}`)
    await page.goto('/tasks')

    // The marker only takes its duration once it has measured a link, and
    // before that reads 0s either way.
    const marker = page.getByRole('navigation').locator('.mantine-FloatingIndicator-root')
    await expect(marker).toHaveAttribute('data-initialized')
    await expect.poll(() => transitionDuration(marker)).toBe(duration)

    await page.getByRole('button', { name: 'New task' }).click()
    const dialog = page.getByRole('dialog', { name: 'New task' })
    await expect(dialog).toBeVisible()
    await expect.poll(() => transitionDuration(dialog)).toBe(duration)
  })
}

for (const screen of [
  { path: '/settings', api: '/api/settings', title: 'Settings', label: 'Loading settings' },
  { path: '/rooms', api: '/api/rooms', title: 'Rooms', label: 'Loading rooms' },
]) {
  test(`${screen.title} shows its skeleton in its frame while ${screen.api} is held`, async ({ page }) => {
    await registerAndSignIn(page, `skeleton-${screen.title.toLowerCase()}`)
    const release = await holdGet(page, screen.api)
    await page.goto(screen.path)

    const skeleton = page.getByRole('progressbar', { name: screen.label })
    await expect(skeleton).toBeVisible()
    // The frame is already there: a load never swaps the page for a spinner.
    await expect(page.getByRole('heading', { level: 1, name: screen.title })).toBeVisible()

    release()
    await expect(skeleton).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}
