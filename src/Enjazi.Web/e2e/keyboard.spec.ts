import { expect, test } from '@playwright/test'
import { openDashboard, seedTasks, twoFrames } from './helpers.js'
import { registerAndSignIn } from './session.js'

// The Phase 8 keyboard layer from docs/design.md, "Keyboard": the N and G
// shortcuts, mod+K, and where they must stay quiet. Every key goes through
// the real browser, so the library's key handling and the app's ignore
// rules are both under test, not a handler called directly. What the
// palette does once open is in palette.spec.ts.

test('N opens the new task dialog from the dashboard, and closing it leaves /tasks', async ({ page }) => {
  await openDashboard(page, 'keys-new')

  await page.keyboard.press('n')
  await expect(page).toHaveURL('/tasks?new')
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page).toHaveURL('/tasks')
})

test('G then C, T and S go to Calendar, Tasks and Settings', async ({ page }) => {
  await openDashboard(page, 'keys-goto')

  for (const [key, path, heading] of [
    ['c', '/calendar', 'Calendar'],
    ['t', '/tasks', 'Tasks'],
    ['s', '/settings', 'Settings'],
  ] as const) {
    await page.keyboard.press('g')
    await page.keyboard.press(key)
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
  }
})

test('G sequences pressed as soon as the last one lands each navigate', async ({ page }) => {
  await openDashboard(page, 'keys-quick')

  // Each G follows the previous arrival at once, well inside tinykeys' one
  // second for a sequence. Both orders: T is bound before C, and one shared
  // binding map lost a C straight after a T.
  for (const [key, path] of [
    ['c', '/calendar'],
    ['t', '/tasks'],
    ['c', '/calendar'],
  ] as const) {
    await page.keyboard.press('g')
    await page.keyboard.press(key)
    await expect(page).toHaveURL(path)
  }
})

test('keys typed into a text input stay in the input', async ({ page }) => {
  await registerAndSignIn(page, 'keys-input')
  await page.goto('/')
  await seedTasks(page, [{ title: 'Rename me' }])
  await page.goto('/tasks')

  // The inline rename input sits outside any dialog, so only the text-entry
  // rule keeps N and G then C from firing here.
  await page.getByRole('button', { name: 'Rename me' }).click()
  const input = page.getByLabel('Task title')
  await expect(input).toBeFocused()
  await input.press('End')
  await input.pressSequentially(' gcn')
  await expect(input).toHaveValue('Rename me gcn')
  await expect(page).toHaveURL('/tasks')
  await expect(page.getByRole('dialog', { name: 'New task' })).toHaveCount(0)

  await input.press('Escape')
  await expect(page.getByRole('button', { name: 'Rename me' })).toBeVisible()
})

test('N works straight after ticking a task, with focus on the checkbox', async ({ page }) => {
  await registerAndSignIn(page, 'keys-tick')
  await page.goto('/')
  await seedTasks(page, [{ title: 'Tick then add' }])
  await page.goto('/tasks')

  const checkbox = page.getByRole('checkbox', { name: 'Complete Tick then add' })
  await checkbox.click()
  await expect(checkbox).toBeFocused()
  // locator.press sends the key to the checkbox itself, so this cannot pass
  // by the row leaving and focus falling back to the page.
  await checkbox.press('n')
  await expect(page).toHaveURL('/tasks?new')
  await expect(page.getByRole('dialog', { name: 'New task' })).toBeVisible()
})

test('mod+K opens the palette from a focused checkbox, but not over the New task dialog', async ({ page }) => {
  await registerAndSignIn(page, 'keys-palette')
  await page.goto('/')
  await seedTasks(page, [{ title: 'Focus then search' }])
  await page.goto('/tasks')
  const palette = page.getByRole('dialog', { name: 'Command palette' })

  await page.getByRole('checkbox', { name: 'Complete Focus then search' }).press('ControlOrMeta+k')
  await expect(palette).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(palette).toHaveCount(0)

  await page.getByRole('button', { name: 'New task' }).click()
  const dialog = page.getByRole('dialog', { name: 'New task' })
  const title = dialog.getByLabel('Title')
  await title.fill('Half written')
  // In the text field, then on a button, where only the dialog rule holds it.
  await title.press('ControlOrMeta+k')
  await dialog.getByRole('button', { name: 'Cancel' }).press('ControlOrMeta+k')
  await twoFrames(page)
  await expect(palette).toHaveCount(0)
  await expect(title).toHaveValue('Half written')
})

test('at phone width, a shortcut closes the open navbar as it navigates', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 })
  await openDashboard(page, 'keys-mobile')
  const navbar = page.getByRole('navigation')
  await expect(navbar).not.toBeInViewport()

  await page.getByRole('button', { name: 'Toggle navigation' }).click()
  await expect(navbar).toBeInViewport()
  await page.keyboard.press('g')
  await page.keyboard.press('c')
  await expect(page).toHaveURL('/calendar')
  await expect(navbar).not.toBeInViewport()
})
