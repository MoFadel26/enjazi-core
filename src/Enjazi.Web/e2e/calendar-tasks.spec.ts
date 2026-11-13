import { expect, test, type Locator, type Page } from '@playwright/test'
import { readTasks, routeWrites, seedTasks, type Seed } from './helpers.js'
import { registerAndSignIn } from './session.js'

// Tasks on the calendar, from docs/design.md "Screens > Calendar" and
// ADR-0021: each task with a due date is a chip at its due time beside the
// events, completed ones while the account's setting allows; a click opens
// the task's edit dialog and a drag moves its due time. Drags press, move and
// release the real mouse; what a drag saved is read back from the API.

type Saved = { title: string; dueAt: string | null; completedAt: string | null }
type LocalTime = [day: number, hour: number, minute: number]

// The page's clock is held at 09:15 today, as in calendar.spec.ts, so "today"
// and the visible week do not move under a test that runs near midnight.
async function openCalendarAt915(page: Page, label: string) {
  await registerAndSignIn(page, label)
  const morning = new Date()
  morning.setHours(9, 15, 0, 0)
  await page.clock.setFixedTime(morning)
  await page.goto('/')
}

// An instant in the browser's zone, `day` days from today at a local time.
function localTime(page: Page, [day, hour, minute]: LocalTime) {
  return page.evaluate(
    ([d, h, m]) => {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, h, m).toISOString()
    },
    [day, hour, minute],
  )
}

// A drag one day sideways stays in the visible week: back a day, unless today
// is Monday, the week's first day.
const sideways = (page: Page) => page.evaluate(() => (new Date().getDay() === 1 ? 1 : -1))

const chip = (page: Page, title: string) => page.locator('.enjazi-fc-task').filter({ hasText: title })

async function savedTask(page: Page, title: string) {
  const task = ((await readTasks(page)) as Saved[]).find((item) => item.title === title)
  if (!task) throw new Error(`No task titled "${title}".`)
  return task
}

const instant = (iso: string | null) => (iso === null ? null : new Date(iso).toISOString())

// Presses the chip near its top, moves by (dx, dy) in steps, and releases.
async function drag(page: Page, target: Locator, dx: number, dy: number) {
  await target.scrollIntoViewIfNeeded()
  const box = await target.boundingBox()
  if (!box) throw new Error('The chip is not on screen.')
  const x = box.x + box.width / 2
  const y = box.y + 6
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) await page.mouse.move(x + (dx * step) / 10, y + (dy * step) / 10)
  await page.mouse.up()
}

// The width of one day's column, from two neighbouring day headers.
async function columnWidth(page: Page) {
  const headers = page.getByRole('columnheader')
  const boxes = await Promise.all([headers.nth(1).boundingBox(), headers.nth(2).boundingBox()])
  if (!boxes[0] || !boxes[1]) throw new Error('No day headers.')
  return boxes[1].x - boxes[0].x
}

async function seedAt(page: Page, tasks: (Omit<Seed, 'dueAt'> & { at?: LocalTime })[]) {
  const seeds: Seed[] = []
  for (const { at, ...task } of tasks) seeds.push({ ...task, dueAt: at ? await localTime(page, at) : null })
  await seedTasks(page, seeds)
}

test('tasks with a due date show at their due time beside the events, completed ones included', async ({ page }) => {
  await openCalendarAt915(page, 'cal-tasks')
  await seedAt(page, [
    { title: 'Pay the rent', at: [0, 10, 0] },
    { title: 'Old report', at: [0, 8, 0], completed: true },
    { title: 'Someday maybe' },
  ])
  await page.goto('/calendar')

  await expect(chip(page, 'Pay the rent')).toHaveText(/^10:00\s*Task: Pay the rent$/)
  await expect(chip(page, 'Old report')).toHaveText(/^08:00\s*Completed task: Old report$/)
  await expect(page.getByText('Someday maybe')).toHaveCount(0)

  // In today's column, below the one an hour earlier.
  const today = page.locator('[role=gridcell][data-date]').filter({ has: chip(page, 'Pay the rent') })
  await expect(today).toHaveCount(1)
  const rent = await chip(page, 'Pay the rent').boundingBox()
  const report = await chip(page, 'Old report').boundingBox()
  expect(rent && report && rent.y > report.y).toBe(true)
})

test('the setting hides completed tasks from the calendar and shows them again', async ({ page }) => {
  await openCalendarAt915(page, 'cal-tasks-setting')
  await seedAt(page, [
    { title: 'Still open', at: [0, 10, 0] },
    { title: 'Already done', at: [0, 11, 0], completed: true },
  ])

  await page.goto('/settings')
  const toggle = page.getByLabel('Show completed tasks')
  await expect(toggle).toBeChecked()
  await toggle.uncheck()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Settings saved.')).toBeVisible()

  await page.getByRole('link', { name: 'Calendar' }).click()
  await expect(chip(page, 'Still open')).toBeVisible()
  await expect(chip(page, 'Already done')).toHaveCount(0)

  // The choice is the account's, not the page's.
  await page.goto('/settings')
  await expect(toggle).not.toBeChecked()
  await toggle.check()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Settings saved.')).toBeVisible()
  await page.getByRole('link', { name: 'Calendar' }).click()
  await expect(chip(page, 'Already done')).toBeVisible()
})

test('clicking a task opens its edit dialog, and a change shows on the calendar and the task list', async ({ page }) => {
  await openCalendarAt915(page, 'cal-tasks-edit')
  await seedAt(page, [{ title: 'Call the plumber', at: [0, 10, 0] }])
  await page.goto('/calendar')

  await chip(page, 'Call the plumber').click()
  const dialog = page.getByRole('dialog', { name: 'Edit task' })
  await expect(dialog.getByLabel('Title')).toHaveValue('Call the plumber')
  await dialog.getByLabel('Title').fill('Call the plumber back')
  await dialog.getByRole('button', { name: 'Save' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(chip(page, 'Call the plumber back')).toBeVisible()

  await page.getByRole('link', { name: 'Tasks', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Call the plumber back' })).toBeVisible()
})

test('dragging a task down the grid moves its due time to where the chip lands', async ({ page }) => {
  await openCalendarAt915(page, 'cal-tasks-drag')
  await seedAt(page, [{ title: 'Water the plants', at: [0, 10, 0] }])
  await page.goto('/calendar')
  const plants = chip(page, 'Water the plants')
  await expect(plants).toContainText('10:00')
  const before = await savedTask(page, 'Water the plants')

  await drag(page, plants, 0, 120)

  // A later time on the same day, on the grid's 15-minute snap, and the chip
  // says the time the API saved.
  await expect.poll(async () => (await savedTask(page, 'Water the plants')).dueAt).not.toBe(before.dueAt)
  const after = await savedTask(page, 'Water the plants')
  const moved = Date.parse(after.dueAt!) - Date.parse(before.dueAt!)
  expect(moved).toBeGreaterThan(0)
  expect(moved % (15 * 60 * 1000)).toBe(0)
  const label = await page.evaluate((iso) => {
    const date = new Date(iso)
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }, after.dueAt!)
  await expect(plants).toContainText(label)
})

test('a task due at 23:59 is drawn inside its day, and a drag to the next column keeps 23:59', async ({ page }) => {
  await openCalendarAt915(page, 'cal-tasks-late')
  await seedAt(page, [{ title: 'Submit the form', at: [0, 23, 59] }])
  await page.goto('/calendar')
  const form = chip(page, 'Submit the form')
  await expect(form).toHaveCount(1)
  await expect(form).toContainText('23:59')

  const direction = await sideways(page)
  await drag(page, form, direction * (await columnWidth(page)), 0)

  const expected = await localTime(page, [direction, 23, 59])
  await expect.poll(async () => instant((await savedTask(page, 'Submit the form')).dueAt)).toBe(expected)
  await expect(form).toHaveCount(1)
  await expect(form).toContainText('23:59')
})

test('a task cannot be dropped in the all-day row', async ({ page }) => {
  await openCalendarAt915(page, 'cal-tasks-allday')
  await seedAt(page, [{ title: 'Renew the visa', at: [0, 10, 0] }])
  await page.goto('/calendar')
  const visa = chip(page, 'Renew the visa')
  await expect(visa).toBeVisible()
  const puts = await routeWrites(page, 'PUT', [])

  const row = await page.getByText('All-day', { exact: true }).boundingBox()
  const box = await visa.boundingBox()
  if (!row || !box) throw new Error('Nothing to measure.')
  await drag(page, visa, 0, row.y + row.height / 2 - (box.y + 6))

  // The grid slides the dragged copy back before it removes it.
  await expect(visa).toHaveCount(1)
  await expect(visa).toContainText('10:00')
  expect(puts.bodies).toHaveLength(0)
})

test('a move the API refuses puts the task back and says why', async ({ page }) => {
  await openCalendarAt915(page, 'cal-tasks-fail')
  await seedAt(page, [{ title: 'Book the dentist', at: [0, 10, 0] }])
  await page.goto('/calendar')
  const dentist = chip(page, 'Book the dentist')
  await expect(dentist).toContainText('10:00')
  const before = await savedTask(page, 'Book the dentist')

  const puts = await routeWrites(page, 'PUT', [{ hold: true, fail: 'The move was refused.' }])
  await drag(page, dentist, 0, 120)
  await expect.poll(() => puts.bodies.length).toBe(1)
  await expect(dentist).not.toContainText('10:00')

  puts.release(0)
  await expect(page.getByText('The move was refused.')).toBeVisible()
  await expect(dentist).toContainText('10:00')
  expect((await savedTask(page, 'Book the dentist')).dueAt).toBe(before.dueAt)
})
