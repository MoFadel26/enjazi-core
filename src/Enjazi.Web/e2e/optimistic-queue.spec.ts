import { expect, test, type Page } from '@playwright/test'
import { holdGet, readTasks, routeWrites, seedTasks, waitForList } from './helpers.js'
import { registerAndSignIn } from './session.js'

// Several updates to one task in flight at once (ADR-0012). They reach the
// server one at a time, and PUT sends every field, so each request must carry
// only the changes made before it that did not fail: never a later change
// still queued, never one that failed. The tests hold and fail chosen
// requests in the browser and read the server afterwards.

test('a rename made while a tick fails keeps the rename and drops the tick', async ({ page }) => {
  await openTasks(page, 'tick-rename', ['Sort the mail'])
  const box = page.getByRole('checkbox', { name: 'Complete Sort the post' })

  const puts = await routeWrites(page, 'PUT', [{ hold: true, fail: 'The tick was refused.' }, { hold: true }])
  await page.getByRole('checkbox', { name: 'Complete Sort the mail' }).click()
  await rename(page, 'Sort the mail', 'Sort the post')
  await expect(box).toBeChecked()

  // The failure takes back the tick alone; the rename is still unanswered.
  puts.release(0)
  await expect(page.getByText('The tick was refused.')).toBeVisible()
  await expect(box).not.toBeChecked()

  const reread = waitForList(page)
  puts.release(1)
  await reread
  await expect(box).not.toBeChecked()
  expect(await readTasks(page)).toEqual([expect.objectContaining({ title: 'Sort the post', completedAt: null })])
})

test('two ticks in flight end with the list read again', async ({ page }) => {
  await openTasks(page, 'tick-two', ['Feed the cat', 'Walk the dog'])

  const puts = await routeWrites(page, 'PUT', [{ hold: true }])
  await page.getByRole('checkbox', { name: 'Complete Feed the cat' }).click()
  await page.getByRole('checkbox', { name: 'Complete Walk the dog' }).click()
  // The streak refetch each update starts never answers here: the list must
  // be read again without waiting for it.
  await holdGet(page, '/api/streak')

  const reread = waitForList(page)
  puts.release(0)
  await reread
  await expect(page.getByRole('checkbox', { name: 'Complete Feed the cat' })).toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Complete Walk the dog' })).toBeChecked()
})

test('a list read that lands mid-tick keeps the tick, and a rename made after saves both', async ({ page }) => {
  await openTasks(page, 'tick-refetch', ['Mend the fence'])
  const box = page.getByRole('checkbox', { name: 'Complete Mend the gate' })

  const puts = await routeWrites(page, 'PUT', [{ hold: true }])
  await page.getByRole('checkbox', { name: 'Complete Mend the fence' }).click()
  // TanStack reads a stale list again when the tab regains focus. The server
  // still has the task open; a task added behind the page's back shows when
  // that answer is on screen.
  await seedTasks(page, [{ title: 'Oil the hinges' }])
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange', { bubbles: true })))
  await expect(page.getByRole('button', { name: 'Oil the hinges' })).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Complete Mend the fence' })).toBeChecked()

  await rename(page, 'Mend the fence', 'Mend the gate')
  await expect(box).toBeChecked()

  const reread = waitForList(page)
  puts.release(0)
  await reread
  expect(puts.bodies[1]).toMatchObject({ title: 'Mend the gate', completed: true })
  expect(await readTasks(page)).toContainEqual(
    expect.objectContaining({ title: 'Mend the gate', completedAt: expect.any(String) }),
  )
  await expect(box).toBeChecked()
})

test('the middle of three updates sends nothing of the one queued behind it', async ({ page }) => {
  await openTasks(page, 'queue-three', ['Plan the trip'])

  const puts = await routeWrites(page, 'PUT', [{ hold: true }, {}, { fail: 'The rename was refused.' }])
  await rename(page, 'Plan the trip', 'Plan the holiday')
  await page.getByRole('checkbox', { name: 'Complete Plan the holiday' }).click()
  await rename(page, 'Plan the holiday', 'Plan the journey')

  const reread = waitForList(page)
  puts.release(0)
  await expect(page.getByText('The rename was refused.')).toBeVisible()
  await reread
  // The tick ran while the second rename waited behind it.
  expect(puts.bodies[1]).toMatchObject({ title: 'Plan the holiday', completed: true })
  expect(await readTasks(page)).toEqual([
    expect.objectContaining({ title: 'Plan the holiday', completedAt: expect.any(String) }),
  ])
  await expect(page.getByRole('checkbox', { name: 'Complete Plan the holiday' })).toBeChecked()
  await expect(page.getByRole('button', { name: 'Plan the journey' })).toHaveCount(0)
})

test('a failed tick is not saved by the rename and untick made behind it', async ({ page }) => {
  await openTasks(page, 'queue-untick', ['Pay the rent'])
  const box = page.getByRole('checkbox', { name: 'Complete Pay the bills' })

  const puts = await routeWrites(page, 'PUT', [{ hold: true, fail: 'The tick was refused.' }])
  await page.getByRole('checkbox', { name: 'Complete Pay the rent' }).click()
  await rename(page, 'Pay the rent', 'Pay the bills')
  await box.click()
  await expect(box).not.toBeChecked()

  const reread = waitForList(page)
  puts.release(0)
  await reread
  expect(puts.bodies.slice(1)).toEqual([
    expect.objectContaining({ title: 'Pay the bills', completed: false }),
    expect.objectContaining({ title: 'Pay the bills', completed: false }),
  ])
  expect(await readTasks(page)).toEqual([expect.objectContaining({ title: 'Pay the bills', completedAt: null })])
  // Completing a task moves the streak and reopening it does not move it back.
  const streak = await page.evaluate(async () => (await (await fetch('/api/streak')).json()) as unknown)
  expect(streak).toMatchObject({ points: 0 })
  await expect(box).not.toBeChecked()
})

test('failed renames take back only themselves, on screen and on the server', async ({ page }) => {
  await openTasks(page, 'queue-renames', ['Clean the desk'])

  const puts = await routeWrites(page, 'PUT', [
    { hold: true, fail: 'The first rename was refused.' },
    { hold: true, fail: 'The second rename was refused.' },
  ])
  await rename(page, 'Clean the desk', 'Clean the shelf')
  await rename(page, 'Clean the shelf', 'Clean the room')
  await page.getByRole('checkbox', { name: 'Complete Clean the room' }).click()

  // The newer rename is still waiting, so its title stays.
  puts.release(0)
  await expect(page.getByText('The first rename was refused.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clean the room', exact: true })).toBeVisible()

  const reread = waitForList(page)
  puts.release(1)
  await expect(page.getByText('The second rename was refused.')).toBeVisible()
  await reread
  // The tick went last, with the title the server still had.
  expect(puts.bodies[2]).toMatchObject({ title: 'Clean the desk', completed: true })
  expect(await readTasks(page)).toEqual([
    expect.objectContaining({ title: 'Clean the desk', completedAt: expect.any(String) }),
  ])
  await expect(page.getByRole('checkbox', { name: 'Complete Clean the desk' })).toBeChecked()
})

test('a save from the edit dialog does not send a tick that then fails', async ({ page }) => {
  await openTasks(page, 'queue-modal', ['Write the report'])
  const box = page.getByRole('checkbox', { name: 'Complete Write the report' })

  // The dialog opens while the tick is in flight, so it shows it completed.
  const puts = await routeWrites(page, 'PUT', [{ hold: true, fail: 'The tick was refused.' }])
  await box.click()
  await page.getByRole('row').filter({ hasText: 'Write the report' }).getByRole('button', { name: 'Edit' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit task' })
  await dialog.getByLabel('Description').fill('Two pages')
  await dialog.getByRole('button', { name: 'Save' }).click()

  const reread = waitForList(page)
  puts.release(0)
  await expect(page.getByText('The tick was refused.')).toBeVisible()
  await reread
  expect(puts.bodies[1]).toMatchObject({ description: 'Two pages', completed: false })
  expect(await readTasks(page)).toEqual([expect.objectContaining({ description: 'Two pages', completedAt: null })])
  await expect(box).not.toBeChecked()
})

// In the All view, where a completed task stays on screen.
async function openTasks(page: Page, label: string, titles: string[]) {
  await registerAndSignIn(page, label)
  await page.goto('/')
  await seedTasks(page, titles.map((title) => ({ title })))
  await page.goto('/tasks')
  await page.getByText('All', { exact: true }).click()
}

async function rename(page: Page, from: string, to: string) {
  await page.getByRole('button', { name: from, exact: true }).click()
  const input = page.getByRole('textbox', { name: 'Task title' })
  await input.fill(to)
  await input.press('Enter')
  await expect(input).toHaveCount(0)
}
