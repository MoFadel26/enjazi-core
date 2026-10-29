import { expect, test, type Page } from '@playwright/test'
import { routeWrites, seedTasks } from './helpers.js'
import { registerAndSignIn } from './session.js'

// Ticking, renaming and deleting a task change the screen before the request
// answers, and a failure puts the task back with a notification (ADR-0012).
// Each request is held until the test releases it. Several updates in flight
// at once are in optimistic-queue.spec.ts.

test('a tick shows at once, before the update answers', async ({ page }) => {
  await registerAndSignIn(page, 'tick')
  await openTasks(page, ['Water the plants'])
  // All keeps a completed task on screen once its linger ends.
  await page.getByText('All', { exact: true }).click()
  const box = page.getByRole('checkbox', { name: 'Complete Water the plants' })

  const puts = await routeWrites(page, 'PUT', [{ hold: true }])
  await box.click()
  await expect(box).toBeChecked()

  const answered = page.waitForResponse((response) => response.request().method() === 'PUT')
  puts.release(0)
  expect((await answered).ok()).toBe(true)
  await expect(box).toBeChecked()
})

test('a failed tick reverts and says why', async ({ page }) => {
  await registerAndSignIn(page, 'tick-fail')
  await openTasks(page, ['Call the bank'])
  await page.getByText('All', { exact: true }).click()
  const box = page.getByRole('checkbox', { name: 'Complete Call the bank' })

  const puts = await routeWrites(page, 'PUT', [{ hold: true, fail: 'The tick was refused.' }])
  await box.click()
  await expect(box).toBeChecked()

  puts.release(0)
  await expect(page.getByText('The tick was refused.')).toBeVisible()
  await expect(box).not.toBeChecked()
})

test('a title renames in place, shows at once and survives a reload', async ({ page }) => {
  await registerAndSignIn(page, 'rename')
  await openTasks(page, ['Draft the outline'])
  const input = page.getByRole('textbox', { name: 'Task title' })

  await page.getByRole('button', { name: 'Draft the outline' }).click()
  await expect(input).toHaveValue('Draft the outline')

  const puts = await routeWrites(page, 'PUT', [{ hold: true }])
  await input.fill('Draft the final outline')
  await input.press('Enter')
  await expect(input).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Draft the final outline' })).toBeVisible()

  const answered = page.waitForResponse((response) => response.request().method() === 'PUT')
  puts.release(0)
  expect((await answered).ok()).toBe(true)

  await page.reload()
  await expect(page.getByRole('button', { name: 'Draft the final outline' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Draft the outline' })).toHaveCount(0)
})

test('Escape, an unchanged title and an empty one save nothing', async ({ page }) => {
  await registerAndSignIn(page, 'rename-none')
  await openTasks(page, ['Book the venue'])
  const puts = await routeWrites(page, 'PUT', [])
  const title = page.getByRole('button', { name: 'Book the venue' })
  const input = page.getByRole('textbox', { name: 'Task title' })

  await title.click()
  await input.fill('Book another venue')
  await input.press('Escape')
  await expect(input).toHaveCount(0)
  await expect(title).toBeVisible()

  await title.click()
  await input.press('Enter')
  await expect(input).toHaveCount(0)

  await title.click()
  await input.fill('')
  await input.press('Enter')
  await expect(input).toHaveCount(0)
  await expect(title).toBeVisible()

  // A real rename last. Any update the three above had sent would have been
  // sent before this one, so this is the only one there may be.
  const answered = page.waitForResponse((response) => response.request().method() === 'PUT')
  await title.click()
  await input.fill('Book the hall')
  await input.press('Enter')
  await answered
  expect(puts.bodies).toEqual([expect.objectContaining({ title: 'Book the hall' })])
})

test('a delete removes the row at once, before the request answers', async ({ page }) => {
  await registerAndSignIn(page, 'delete')
  await openTasks(page, ['Keep the plan', 'Drop the draft'])
  const row = page.getByRole('row').filter({ hasText: 'Drop the draft' })

  const deletes = await routeWrites(page, 'DELETE', [{ hold: true }])
  await row.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(row).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'Keep the plan' })).toBeVisible()

  const answered = page.waitForResponse((response) => response.request().method() === 'DELETE')
  deletes.release(0)
  expect((await answered).ok()).toBe(true)

  await page.reload()
  await expect(page.getByRole('row').filter({ hasText: 'Keep the plan' })).toBeVisible()
  await expect(row).toHaveCount(0)
})

test('a failed delete brings the row back and says why', async ({ page }) => {
  await registerAndSignIn(page, 'delete-fail')
  await openTasks(page, ['Keep the plan', 'Drop the draft'])
  const row = page.getByRole('row').filter({ hasText: 'Drop the draft' })

  const deletes = await routeWrites(page, 'DELETE', [{ hold: true, fail: 'The delete was refused.' }])
  await row.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(row).toHaveCount(0)

  deletes.release(0)
  await expect(page.getByText('The delete was refused.')).toBeVisible()
  await expect(row).toBeVisible()
})

async function openTasks(page: Page, titles: string[]) {
  await page.goto('/')
  await seedTasks(page, titles.map((title) => ({ title })))
  await page.goto('/tasks')
}
