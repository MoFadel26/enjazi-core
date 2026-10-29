import { expect, test, type Locator } from '@playwright/test'
import { openDashboard, seedTasks } from './helpers.js'
import { registerAndSignIn } from './session.js'

// The command palette from docs/design.md, "Keyboard": opened by mod+K or the
// sidebar's Search row, it jumps to a screen or opens an open task. When
// mod+K may open it is in keyboard.spec.ts.

const look = (locator: Locator) =>
  locator.evaluate((element) => {
    const { backgroundColor, boxShadow } = getComputedStyle(element)
    return { backgroundColor, boxShadow }
  })

const channels = (color: string) => color.match(/[\d.]+/g)?.map(Number) ?? []

// Relative luminance of an sRGB colour, as WCAG defines it.
function luminance([r = 0, g = 0, b = 0]: number[]) {
  const linear = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

// WCAG's contrast ratio of a computed rgb() or rgba() colour against the
// opaque panel under it. A translucent colour is laid over the panel first.
function contrast(color: string, panel: string) {
  const under = channels(panel)
  const [alpha = 1] = channels(color).slice(3)
  const over = channels(color)
    .slice(0, 3)
    .map((value, index) => alpha * value + (1 - alpha) * (under[index] ?? 0))
  const [light = 0, dark = 0] = [luminance(over), luminance(under)].sort((a, b) => b - a)
  return (light + 0.05) / (dark + 0.05)
}

test('the palette opens with mod+K and jumps to a screen typed into it', async ({ page }) => {
  await openDashboard(page, 'palette-goto')

  await page.keyboard.press('ControlOrMeta+k')
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(palette).toBeVisible()
  const search = palette.getByPlaceholder('Search or jump to…')
  await expect(search).toBeFocused()

  // "Calendar" holds an N: typed into the palette it must not fire the shortcut.
  await search.pressSequentially('Calendar')
  await expect(page).toHaveURL('/')
  await expect(palette.getByRole('button')).toHaveCount(1)
  await search.press('Enter')

  await expect(page).toHaveURL('/calendar')
  await expect(palette).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1, name: 'Calendar' })).toBeVisible()
})

test('the palette lists open tasks and opens the chosen one for editing', async ({ page }) => {
  await registerAndSignIn(page, 'palette-task')
  await page.goto('/')
  const [id] = await seedTasks(page, [
    { title: 'Review the keyboard layer' },
    { title: 'Already finished', completed: true },
  ])
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  await page.keyboard.press('ControlOrMeta+k')
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  const action = palette.getByRole('button', { name: 'Review the keyboard layer' })
  await expect(action).toBeVisible()
  await expect(palette.getByRole('button', { name: 'Already finished' })).toHaveCount(0)

  await action.click()
  await expect(palette).toHaveCount(0)
  await expect(page).toHaveURL(`/tasks?edit=${id}`)
  const dialog = page.getByRole('dialog', { name: 'Edit task' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByLabel('Title')).toHaveValue('Review the keyboard layer')
})

test('the palette leaves no second New task button behind on /tasks', async ({ page }) => {
  await registerAndSignIn(page, 'palette-closed')
  await page.goto('/tasks')
  await expect(page.getByText('No tasks here.')).toBeVisible()
  const newTask = page.getByRole('button', { name: 'New task' })
  await expect(newTask).toHaveCount(1)

  // Open, its own New task action is there; closed, it is gone again.
  await page.keyboard.press('ControlOrMeta+k')
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(palette.getByRole('button', { name: 'New task' })).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(palette).toHaveCount(0)
  await expect(newTask).toHaveCount(1)
})

test('the sidebar Search row opens the palette', async ({ page }) => {
  await openDashboard(page, 'palette-search')

  await page.getByRole('button', { name: 'Search' }).click()
  const palette = page.getByRole('dialog', { name: 'Command palette' })
  await expect(palette).toBeVisible()
  await expect(palette.getByPlaceholder('Search or jump to…')).toBeFocused()
})

// Marked means a bar or a fill at 3:1 or more against the panel, WCAG's
// minimum for a component's state. surface-2, the hover, is under 1.1:1.
for (const colorScheme of ['light', 'dark'] as const) {
  test(`the action the keyboard selects is marked against the ${colorScheme} panel`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await openDashboard(page, `palette-selected-${colorScheme}`)
    await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', colorScheme)
    await page.keyboard.press('ControlOrMeta+k')
    const palette = page.getByRole('dialog', { name: 'Command palette' })
    await expect(palette.getByPlaceholder('Search or jump to…')).toBeFocused()

    await page.keyboard.press('ArrowDown')
    const selected = palette.locator('[data-selected]')
    await expect(selected).toHaveCount(1)
    const panel = await palette.evaluate((element) => getComputedStyle(element).backgroundColor)
    const mark = await look(selected)

    const bar = mark.boxShadow.includes('inset') ? mark.boxShadow.match(/rgba?\([^)]*\)/)?.[0] : undefined
    const ratio = Math.max(contrast(mark.backgroundColor, panel), bar ? contrast(bar, panel) : 1)
    expect(ratio, JSON.stringify({ panel, ...mark })).toBeGreaterThanOrEqual(3)
    // The mark belongs to the selection, not to every action.
    expect(await look(palette.getByRole('button', { name: 'Tasks' }))).not.toEqual(mark)
  })
}
