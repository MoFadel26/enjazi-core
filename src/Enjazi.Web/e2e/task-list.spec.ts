import { expect, test, type Page } from '@playwright/test'
import { holdGet, seedTasks, twoFrames } from './helpers.js'
import { registerAndSignIn } from './session.js'

// The Phase 8 task list, from docs/design.md "Screens > Tasks" and "Loading":
// tasks fall into the due-date groups in their order, a task ticked in the
// Open view lingers before it leaves, the skeleton stands in while the list
// loads, the empty state's action opens the create dialog, and ?edit opens
// only a task that exists.

// Due dates in the browser's zone, which is the zone the list groups by.
function dueDates(page: Page) {
  return page.evaluate(() => {
    const now = Date.now()
    const midnight = new Date(now).setHours(24, 0, 0, 0)
    const day = 24 * 60 * 60 * 1000
    const at = (time: number) => new Date(time).toISOString()
    return {
      untilMidnight: midnight - now,
      yesterday: at(now - day),
      laterToday: at(now + (midnight - now) / 2),
      inThreeDays: at(now + 3 * day),
      inThirtyDays: at(now + 30 * day),
    }
  })
}

// A header row reads as its label then its count.
const header = (label: string, count: number) => new RegExp(`^${label}\\s*${count}$`)

test('open tasks are grouped by due date, and All adds Completed last', async ({ page }) => {
  await registerAndSignIn(page, 'task-groups')
  await page.goto('/')
  const due = await dueDates(page)
  test.skip(due.untilMidnight < 10 * 60 * 1000, 'Under ten minutes to midnight: "later today" could turn overdue.')

  await seedTasks(page, [
    { title: 'Due in thirty days', dueAt: due.inThirtyDays },
    { title: 'Has no due date', dueAt: null },
    { title: 'Due yesterday', dueAt: due.yesterday },
    { title: 'Due in three days', dueAt: due.inThreeDays },
    { title: 'Due later today', dueAt: due.laterToday },
    // Due yesterday too: a completed task goes to Completed, not Overdue.
    { title: 'Already completed', dueAt: due.yesterday, completed: true },
  ])
  await page.goto('/tasks')

  const rows = page.getByRole('row')
  await expect(rows).toHaveText([
    header('Overdue', 1),
    /Due yesterday/,
    header('Today', 1),
    /Due later today/,
    header('This week', 1),
    /Due in three days/,
    header('Later', 1),
    /Due in thirty days/,
    header('No date', 1),
    /Has no due date/,
  ])

  await page.getByText('All', { exact: true }).click()
  await expect(rows).toHaveText([
    header('Overdue', 1),
    /Due yesterday/,
    header('Today', 1),
    /Due later today/,
    header('This week', 1),
    /Due in three days/,
    header('Later', 1),
    /Due in thirty days/,
    header('No date', 1),
    /Has no due date/,
    header('Completed', 1),
    /Already completed/,
  ])
})

test('a task ticked in the Open view stays, struck through, then leaves', async ({ page }) => {
  await registerAndSignIn(page, 'task-linger')
  await page.goto('/')
  const due = await dueDates(page)
  await seedTasks(page, [
    { title: 'Ticked and lingering', dueAt: due.inThirtyDays },
    { title: 'Still open', dueAt: null },
  ])
  await page.goto('/tasks')

  const rows = page.getByRole('row')
  await expect(rows).toHaveText([header('Later', 1), /Ticked and lingering/, header('No date', 1), /Still open/])

  // Without the linger the patched row would leave at once, and the copy
  // AnimatePresence keeps while it fades is the unticked one.
  const box = page.getByRole('checkbox', { name: 'Complete Ticked and lingering' })
  await box.click()
  await expect(box).toBeChecked()
  await expect(rows).toHaveText([header('Later', 1), /Ticked and lingering/, header('No date', 1), /Still open/])
  await expect(page.getByRole('button', { name: 'Ticked and lingering' })).toHaveCSS(
    'text-decoration-line',
    'line-through',
  )

  // After the pause it is gone, and its now empty group with it.
  await expect(rows).toHaveText([header('No date', 1), /Still open/])
})

test('the skeleton stands in for the list until it loads', async ({ page }) => {
  await registerAndSignIn(page, 'task-skeleton')
  const release = await holdGet(page, '/api/tasks')
  await page.goto('/tasks')

  // The frame renders around the skeleton; the list replaces only the skeleton.
  const skeleton = page.getByRole('progressbar', { name: 'Loading tasks' })
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible()
  await expect(skeleton).toBeVisible()

  release()
  await expect(skeleton).toHaveCount(0)
  await expect(page.getByText('No tasks here.')).toBeVisible()
})

test('a new account\'s empty state offers a task, and its action opens the create dialog', async ({ page }) => {
  await registerAndSignIn(page, 'task-empty')
  await page.goto('/tasks')
  await expect(page.getByText('No tasks here.')).toBeVisible()
  await expect(page.getByText('Add your first task to start a streak.')).toBeVisible()

  await page.getByRole('button', { name: 'Add a task' }).click()
  await expect(page.getByRole('dialog', { name: 'New task' })).toBeVisible()
})

test('?edit opens a task once the list loads, and an unknown id opens nothing', async ({ page }) => {
  await registerAndSignIn(page, 'task-url')
  await page.goto('/')
  const [id] = await seedTasks(page, [{ title: 'Opened from the URL', dueAt: null }])

  await page.goto(`/tasks?edit=${id}`)
  const dialog = page.getByRole('dialog', { name: 'Edit task' })
  await expect(dialog.getByLabel('Title')).toHaveValue('Opened from the URL')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page).toHaveURL('/tasks')

  await page.goto(`/tasks?edit=${crypto.randomUUID()}`)
  await expect(page.getByRole('row').filter({ hasText: 'Opened from the URL' })).toBeVisible()
  await twoFrames(page)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})
