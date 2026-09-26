import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { seedTasks } from './helpers.js'
import { registerAndSignIn } from './session.js'

// The Phase 9 check from docs/design.md "Colour": all four palettes, in both
// schemes, paint their own canvas and clear WCAG AA. Each palette is chosen
// through the account, as a user would, and then four screens are visited so
// the coloured parts the palettes were computed against are on screen: the
// dashboard, the tasks list with an overdue date and a struck completed
// title, a room with an own message over the accent tint, and the settings
// form. axe-core resolves the composited colour behind each piece of text in
// the rendered page (ADR-0013), so what is checked is the painted app and not
// a list of hexes. The last test covers the picker: it applies a palette
// before Save, a screen left unsaved goes back to the account's palette, and
// a reload after Save paints the saved one with no flash of another.

// The canvas of each scheme: the palette's white in light and its dark shade
// 7 in dark, the indexes docs/design.md "Roles" documents. Written out, as in
// theme.spec.ts, so a canvas that moves in the theme shows up here as a
// failure rather than passing against itself.
const cases = [
  { id: 'enjazi', label: 'Enjazi', light: 'rgb(255, 255, 255)', dark: 'rgb(1, 1, 2)' },
  { id: 'nord', label: 'Nord', light: 'rgb(236, 239, 244)', dark: 'rgb(46, 52, 64)' },
  { id: 'solarized', label: 'Solarized', light: 'rgb(253, 246, 227)', dark: 'rgb(0, 43, 54)' },
  { id: 'dracula', label: 'Dracula', light: 'rgb(255, 251, 235)', dark: 'rgb(40, 42, 54)' },
] as const

const overdue = 'Overdue in every palette'
const completed = 'Completed in every palette'
const ownMessage = 'My own message, over the accent tint.'

// Writes the two appearance settings into the account and leaves the rest of
// them as they are, which is what the settings screen sends too. From inside
// the page: Playwright's request context does not send the Secure cookie back
// over plain http (ADR-0009).
async function setAppearance(page: Page, palette: string, theme: 'light' | 'dark') {
  const status = await page.evaluate(
    async (appearance) => {
      const current = (await (await fetch('/api/settings')).json()) as object
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, ...appearance }),
      })
      return response.status
    },
    { palette, theme },
  )
  expect(status).toBe(200)
}

// A room with one message from the account itself, so the room screen has an
// own-message bubble on it, and its id for the URL.
function seedRoom(page: Page, name: string) {
  return page.evaluate(
    async ([roomName, body]) => {
      const send = (url: string, data: object) =>
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const created = await send('/api/rooms', { name: roomName, description: null })
      if (!created.ok) throw new Error(`creating the room failed: ${created.status}`)
      const { id } = (await created.json()) as { id: string }
      const sent = await send(`/api/rooms/${id}/messages`, { body })
      if (!sent.ok) throw new Error(`sending the message failed: ${sent.status}`)
      return id
    },
    [name, ownMessage],
  )
}

// What each screen has to show before axe looks at it. The tasks list opens
// on Open, and a completed task is only in All. Last, every element motion is
// fading has to be fully in: axe composites opacity, so a row caught halfway
// through rising in reads as a contrast failure it does not have.
async function settle(page: Page, path: string) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  if (path === '/tasks') {
    await page.getByText('All', { exact: true }).click()
    await expect(page.getByRole('button', { name: overdue })).toBeVisible()
    await expect(page.getByRole('button', { name: completed })).toBeVisible()
  }
  if (path.startsWith('/rooms/')) {
    await expect(page.getByTestId('message')).toContainText(ownMessage)
  }
  await expect
    .poll(() =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>('[style*="opacity"]')).every(
          (element) => getComputedStyle(element).opacity === '1',
        ),
      ),
    )
    .toBe(true)
}

type ContrastData = { fgColor: string; bgColor: string; contrastRatio: number }

// axe reports one node per failing pair and puts the colours it resolved in
// the check's data. They are mapped to what a reader needs, because an
// `expect(violations).toEqual([])` that fires says only that something on the
// screen is unreadable, not which element, against what, or by how much.
async function contrastFailures(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
  return violations.flatMap((violation) =>
    violation.nodes.map((node) => {
      const data: ContrastData | undefined = node.any.find((check) => check.id === 'color-contrast')?.data
      return {
        selector: node.target.flat().join(' '),
        colours: data ? `${data.fgColor} on ${data.bgColor}` : 'not resolved',
        ratio: data ? data.contrastRatio : null,
      }
    }),
  )
}

for (const palette of cases) {
  test(`the ${palette.label} palette paints its canvas and reads in both schemes`, async ({ page }) => {
    await registerAndSignIn(page, `colors-${palette.id}`)
    await page.goto('/')
    const yesterday = await page.evaluate(() => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    await seedTasks(page, [{ title: overdue, dueAt: yesterday }, { title: completed, completed: true }])
    const roomId = await seedRoom(page, `Colours ${palette.id} ${Date.now()}`)
    const screens = ['/', '/tasks', `/rooms/${roomId}`, '/settings']

    for (const scheme of ['light', 'dark'] as const) {
      await setAppearance(page, palette.id, scheme)
      for (const path of screens) {
        const where = `${palette.label}, ${scheme}, ${path}`
        await page.goto(path)
        await expect(page.locator('html')).toHaveAttribute('data-enjazi-palette', palette.id)
        await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', scheme)
        await settle(page, path)
        await expect
          .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor), { message: where })
          .toBe(palette[scheme])
        expect(await contrastFailures(page), `colour contrast on ${where}`).toEqual([])
      }
    }
  })
}

test('a palette applies while it is picked, is restored unsaved, and survives a reload', async ({ page }) => {
  await registerAndSignIn(page, 'colors-picker')
  await page.goto('/settings')
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-enjazi-palette', 'enjazi')

  // The whole screen is the preview, so the choice lands before Save.
  await page.getByRole('combobox', { name: 'Palette' }).click()
  await page.getByRole('option', { name: 'Nord' }).click()
  await expect(html).toHaveAttribute('data-enjazi-palette', 'nord')

  // Leaving without saving is not a silent save: the account still says
  // enjazi, and that is what the app goes back to.
  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(html).toHaveAttribute('data-enjazi-palette', 'enjazi')

  await page.goto('/settings')
  await page.getByRole('combobox', { name: 'Palette' }).click()
  await page.getByRole('option', { name: 'Dracula' }).click()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Settings saved.')).toBeVisible()

  // Read once, with no retry and no poll: the first render reads the stored
  // palette, so a load never paints another palette first.
  await page.goto('/')
  expect(await html.getAttribute('data-enjazi-palette')).toBe('dracula')
  await page.goto('/tasks')
  expect(await html.getAttribute('data-enjazi-palette')).toBe('dracula')
})
