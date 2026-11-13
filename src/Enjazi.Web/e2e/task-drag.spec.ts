import { expect, test, type Locator, type Page } from '@playwright/test'
import { readTasks, routeWrites, seedTasks, twoFrames } from './helpers.js'
import { registerAndSignIn } from './session.js'

// Dragging a task onto another group, from docs/design.md "Screens > Tasks >
// Dragging" and ADR-0020. The pointer tests press, move and release the real
// mouse on the Move handle, and the keyboard test presses real keys, so the
// library's sensors and the app's rules are both under test. What a drop
// saved is read back from the API, not from the screen.

type Saved = { title: string; dueAt: string | null; completedAt: string | null }

// A header row reads as its label then its count.
const header = (label: string, count: number) => new RegExp(`^${label}\\s*${count}$`)
const headerOf = (page: Page, label: string) => page.getByRole('row').filter({ hasText: new RegExp(`^${label}\\s*\\d+$`) })
const rowOf = (page: Page, title: string) => page.getByRole('row').filter({ hasText: title })
const handleOf = (page: Page, title: string) => rowOf(page, title).getByRole('button', { name: 'Move', exact: true })
// The drag's live region. The streak chip has the page's other one.
const announcer = (page: Page) => page.locator('[id^="DndLiveRegion"]')

// Instants in the browser's zone, the zone a drop computes dates in: `day`
// days from today at a local time. Also how long until local midnight.
type LocalTime = [day: number, hour: number, minute: number]

async function localTimes<Name extends string>(page: Page, times: Record<Name, LocalTime>) {
  const wanted = Object.entries<LocalTime>(times)
  const read = await page.evaluate((entries) => {
    const now = new Date()
    const at = ([day, hour, minute]: number[]) =>
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, hour, minute)
    return {
      at: entries.map(([name, time]) => [name, at(time).toISOString()]),
      untilMidnight: at([1, 0, 0]).getTime() - now.getTime(),
    }
  }, wanted)
  return { at: Object.fromEntries(read.at) as Record<Name, string>, untilMidnight: read.untilMidnight }
}

// A drop late in the day could land after midnight, on the next day's dates.
function skipNearMidnight(untilMidnight: number) {
  test.skip(untilMidnight < 10 * 60 * 1000, 'Under ten minutes to midnight: "today" could change mid-test.')
}

// Rows slide when the drop targets appear. Where the row is once it has
// stopped: two readings in a row that agree.
async function settledBox(row: Locator) {
  let last = ''
  await expect
    .poll(async () => {
      const previous = last
      last = JSON.stringify(await row.boundingBox())
      return last === previous
    })
    .toBe(true)
  const box = await row.boundingBox()
  if (!box) throw new Error('The row is not on screen.')
  return box
}

// Presses the task's handle and moves past the four pixels that make a press
// a drag, but not far enough to carry the task out of its place.
async function pickUp(page: Page, title: string) {
  const box = await settledBox(handleOf(page, title))
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + 8, { steps: 4 })
  await expect(announcer(page)).toHaveText(`Picked up ${title}.`)
  return { x, y: y + 8 }
}

// Moves the pressed pointer onto a group's header row.
async function carryTo(page: Page, label: string) {
  const box = await settledBox(headerOf(page, label))
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 })
}

// The whole drag: pick up, carry until the group is marked as the target,
// release.
async function dragTo(page: Page, title: string, label: string) {
  await pickUp(page, title)
  await carryTo(page, label)
  await expect(headerOf(page, label)).toHaveAttribute('data-drop-over', 'true')
  await page.mouse.up()
  await expect(announcer(page)).toHaveText(`${title} was moved to ${label}.`)
}

async function savedTask(page: Page, title: string) {
  const tasks = (await readTasks(page)) as Saved[]
  const task = tasks.find((item) => item.title === title)
  if (!task) throw new Error(`No task titled "${title}".`)
  return task
}

// The same instant, whichever way each side wrote it.
const instant = (iso: string | null) => (iso === null ? null : new Date(iso).toISOString())

async function openTasks(page: Page, label: string) {
  await registerAndSignIn(page, label)
  await page.goto('/')
}

test('a task dropped on Today is due today, at once and after a reload', async ({ page }) => {
  await openTasks(page, 'drag-today')
  const { at, untilMidnight } = await localTimes(page, { endOfToday: [0, 23, 59] })
  skipNearMidnight(untilMidnight)
  await seedTasks(page, [{ title: 'Plan the trip' }])
  await page.goto('/tasks')
  const rows = page.getByRole('row')
  await expect(rows).toHaveText([header('No date', 1), /Plan the trip/])

  const puts = await routeWrites(page, 'PUT', [{ hold: true }])
  await dragTo(page, 'Plan the trip', 'Today')

  // Before the update answers: in Today, with the time a dateless task gets,
  // and the targets that only showed for the drag are gone.
  await expect(rows).toHaveText([header('Today', 1), /Plan the trip.*23:59$/])
  expect(puts.bodies).toEqual([
    { title: 'Plan the trip', description: null, priority: 'Medium', dueAt: at.endOfToday, completed: false },
  ])

  const answered = page.waitForResponse((response) => response.request().method() === 'PUT')
  puts.release(0)
  expect((await answered).ok()).toBe(true)

  await page.reload()
  await expect(rows).toHaveText([header('Today', 1), /Plan the trip.*23:59$/])
})

test('each group sets its own day, keeps a time of day and gives a dateless task 23:59', async ({ page }) => {
  await openTasks(page, 'drag-dates')
  const { at, untilMidnight } = await localTimes(page, {
    yesterdayMidnight: [-1, 0, 0],
    yesterdayLate: [-1, 23, 59],
    todayMidnight: [0, 0, 0],
    todayLate: [0, 23, 59],
    tomorrowMorning: [1, 9, 30],
    tomorrowLate: [1, 23, 59],
    eighthDayMorning: [8, 9, 30],
    eighthDayLate: [8, 23, 59],
    thirtiethDayMorning: [30, 9, 30],
  })
  skipNearMidnight(untilMidnight)
  await seedTasks(page, [
    { title: 'Timed task', dueAt: at.thirtiethDayMorning },
    { title: 'Dateless task' },
    { title: 'Late yesterday', dueAt: at.yesterdayLate },
    { title: 'Early yesterday', dueAt: at.yesterdayMidnight },
  ])
  await page.goto('/tasks')
  const due = async (title: string) => instant((await savedTask(page, title)).dueAt)

  // Later to This week, a group with no tasks until the drop: tomorrow, at
  // the task's own time. Then back to Later: the eighth day from today.
  await dragTo(page, 'Timed task', 'This week')
  expect(await due('Timed task')).toBe(at.tomorrowMorning)
  await dragTo(page, 'Timed task', 'Later')
  expect(await due('Timed task')).toBe(at.eighthDayMorning)

  // A task with no date has no time to keep, so it gets the end of the day.
  await dragTo(page, 'Dateless task', 'This week')
  expect(await due('Dateless task')).toBe(at.tomorrowLate)
  await dragTo(page, 'Dateless task', 'Later')
  expect(await due('Dateless task')).toBe(at.eighthDayLate)
  await dragTo(page, 'Dateless task', 'No date')
  expect(await due('Dateless task')).toBeNull()

  // Out of Overdue: the kept time is still to come today, so it is in Today.
  await dragTo(page, 'Late yesterday', 'Today')
  expect(await due('Late yesterday')).toBe(at.todayLate)

  // The kept time has already passed today: the date moves to today and the
  // task is still overdue.
  await dragTo(page, 'Early yesterday', 'Today')
  expect(await due('Early yesterday')).toBe(at.todayMidnight)

  await expect(page.getByRole('row')).toHaveText([
    header('Overdue', 1),
    /Early yesterday/,
    header('Today', 1),
    /Late yesterday/,
    header('Later', 1),
    /Timed task/,
    header('No date', 1),
    /Dateless task/,
  ])
})

test('a drag shows every group that takes the task; Overdue, its own group and Escape move nothing', async ({ page }) => {
  await openTasks(page, 'drag-targets')
  const { at } = await localTimes(page, { yesterday: [-1, 12, 0] })
  await seedTasks(page, [{ title: 'Late already', dueAt: at.yesterday }, { title: 'Sort the photos' }])
  await page.goto('/tasks')
  const rows = page.getByRole('row')
  const atRest = [header('Overdue', 1), /Late already/, header('No date', 1), /Sort the photos/]
  await expect(rows).toHaveText(atRest)
  const puts = await routeWrites(page, 'PUT', [])
  const live = announcer(page)

  // The empty groups are there only while the task is held.
  const pointer = await pickUp(page, 'Sort the photos')
  await expect(rows).toHaveText([
    header('Overdue', 1),
    /Late already/,
    header('Today', 0),
    header('This week', 0),
    header('Later', 0),
    header('No date', 1),
    /Sort the photos/,
    header('Completed', 0),
  ])

  // Three of them opened above the task and pushed its row down. The copy
  // being dragged stayed under the pointer, and the group that slid under
  // the pointer instead is not a target: the task has not been carried
  // anywhere yet, so letting go moves nothing.
  await settledBox(rowOf(page, 'Sort the photos'))
  const copy = await page.getByTestId('dragged-task').boundingBox()
  if (!copy) throw new Error('Nothing is being dragged.')
  expect(pointer.y).toBeGreaterThan(copy.y)
  expect(pointer.y).toBeLessThan(copy.y + copy.height)
  // The row beneath the pointer, below the copy: a hit test finds cells.
  const under = await page.evaluate(
    ({ x, y }) => document.elementsFromPoint(x, y).find((element) => element.closest('tr'))?.closest('tr')?.textContent,
    pointer,
  )
  expect(under).toMatch(header('This week', 0))
  await expect(page.locator('[data-drop-over]')).toHaveCount(0)
  await page.mouse.up()
  await expect(live).toHaveText('Sort the photos was not moved.')
  await expect(rows).toHaveText(atRest)

  await pickUp(page, 'Sort the photos')

  // Over a group that takes it, the group is marked. Over Overdue nothing is,
  // and releasing there leaves the task where it was.
  await carryTo(page, 'Today')
  await expect(headerOf(page, 'Today')).toHaveAttribute('data-drop-over', 'true')
  await expect(live).toHaveText('Sort the photos is over Today.')
  await carryTo(page, 'Overdue')
  await expect(live).toHaveText('Sort the photos is not over a group.')
  await expect(page.locator('[data-drop-over]')).toHaveCount(0)
  await page.mouse.up()
  await expect(live).toHaveText('Sort the photos was not moved.')
  await expect(rows).toHaveText(atRest)

  // Its own group is not a target either.
  await pickUp(page, 'Sort the photos')
  await carryTo(page, 'Today')
  await expect(live).toHaveText('Sort the photos is over Today.')
  await carryTo(page, 'No date')
  await expect(live).toHaveText('Sort the photos is not over a group.')
  await page.mouse.up()
  await expect(rows).toHaveText(atRest)

  // Escape drops the drag, even over a group that would take the task.
  await pickUp(page, 'Sort the photos')
  await carryTo(page, 'Today')
  await expect(live).toHaveText('Sort the photos is over Today.')
  await page.keyboard.press('Escape')
  await expect(live).toHaveText('Sort the photos was not moved.')
  await page.mouse.up()
  await expect(rows).toHaveText(atRest)

  // Writes go out in order, so the one real move being the only update sent
  // shows the four before it sent none.
  await dragTo(page, 'Sort the photos', 'Today')
  await expect(rows).toHaveText([header('Overdue', 1), /Late already/, header('Today', 1), /Sort the photos/])
  await expect.poll(() => puts.bodies.length).toBe(1)
})

test('Completed ticks a dropped task and leaves its date; dragging it out reopens it', async ({ page }) => {
  await openTasks(page, 'drag-completed')
  const { at, untilMidnight } = await localTimes(page, { yesterdayMorning: [-1, 10, 0], tomorrowMorning: [1, 10, 0] })
  skipNearMidnight(untilMidnight)
  await seedTasks(page, [
    { title: 'Old report', dueAt: at.yesterdayMorning, completed: true },
    { title: 'Send the invoice' },
  ])
  await page.goto('/tasks')
  const rows = page.getByRole('row')

  // All: the task moves to Completed, ticked, and earns its points.
  await page.getByText('All', { exact: true }).click()
  await expect(rows).toHaveText([header('No date', 1), /Send the invoice/, header('Completed', 1), /Old report/])
  await dragTo(page, 'Send the invoice', 'Completed')
  await expect(rows).toHaveText([header('Completed', 2), /Send the invoice/, /Old report/])
  await expect(page.getByRole('checkbox', { name: 'Complete Send the invoice' })).toBeChecked()
  await expect(page.getByRole('status').filter({ hasText: 'points' })).toHaveText('+10 points')
  const invoice = await savedTask(page, 'Send the invoice')
  expect(invoice.completedAt).not.toBeNull()
  expect(invoice.dueAt).toBeNull()

  // Done: dragged out to a dated group, the task is open again with that
  // group's date at its own time, and leaves this view.
  await page.getByText('Done', { exact: true }).click()
  await expect(rows).toHaveText([header('Completed', 2), /Send the invoice/, /Old report/])
  await dragTo(page, 'Old report', 'This week')
  await expect(rows).toHaveText([header('Completed', 1), /Send the invoice/])
  let report = await savedTask(page, 'Old report')
  expect(report.completedAt).toBeNull()
  expect(instant(report.dueAt)).toBe(at.tomorrowMorning)

  // Open: dropped on Completed, the task leaves, keeping its date.
  await page.getByText('Open', { exact: true }).click()
  await expect(rows).toHaveText([header('This week', 1), /Old report/])
  await dragTo(page, 'Old report', 'Completed')
  await expect(page.getByText('Everything open is done.')).toBeVisible()
  report = await savedTask(page, 'Old report')
  expect(report.completedAt).not.toBeNull()
  expect(instant(report.dueAt)).toBe(at.tomorrowMorning)
})

test('a move the API refuses puts the task back and says why', async ({ page }) => {
  await openTasks(page, 'drag-fail')
  await seedTasks(page, [{ title: 'File the taxes' }])
  await page.goto('/tasks')
  const rows = page.getByRole('row')

  const puts = await routeWrites(page, 'PUT', [{ hold: true, fail: 'The move was refused.' }])
  await dragTo(page, 'File the taxes', 'Later')
  await expect(rows).toHaveText([header('Later', 1), /File the taxes/])

  puts.release(0)
  await expect(page.getByText('The move was refused.')).toBeVisible()
  await expect(rows).toHaveText([header('No date', 1), /File the taxes/])
  expect((await savedTask(page, 'File the taxes')).dueAt).toBeNull()
})

test('the keyboard moves a task: Space picks it up, the arrows choose a group, Space drops it', async ({ page }) => {
  await openTasks(page, 'drag-keys')
  const { at, untilMidnight } = await localTimes(page, { tonight: [0, 23, 58], endOfToday: [0, 23, 59] })
  skipNearMidnight(untilMidnight)
  await seedTasks(page, [{ title: 'Due tonight', dueAt: at.tonight }, { title: 'Water the plants' }])
  await page.goto('/tasks')
  const rows = page.getByRole('row')
  const atRest = [header('Today', 1), /Due tonight/, header('No date', 1), /Water the plants/]
  await expect(rows).toHaveText(atRest)
  const puts = await routeWrites(page, 'PUT', [])
  const live = announcer(page)
  const handle = handleOf(page, 'Water the plants')

  // The library starts listening for the arrows, and the targets are
  // measured, just after the pick-up is announced: sooner than a person can
  // press the next key, but not sooner than a test can.
  const pickUpWith = async (key: string) => {
    await page.keyboard.press(key)
    await expect(live).toHaveText('Picked up Water the plants.')
    await twoFrames(page)
  }

  // The handle says how to use it, and a task just picked up is over nothing.
  await expect(handle).toHaveAccessibleDescription(/press Space or Enter/)
  await handle.focus()
  await pickUpWith('Space')
  await expect(page.locator('[data-drop-over]')).toHaveCount(0)

  // Up and Down go from group to group, counted from the task's own group
  // and past it, and stop at the first and the last. With these two tasks
  // the header of Later opens exactly where the dragged copy is, so the
  // first Up chooses it without moving the copy.
  const press = async (key: string, label: string) => {
    await page.keyboard.press(key)
    await expect(live).toHaveText(`Water the plants is over ${label}.`)
    await expect(headerOf(page, label)).toHaveAttribute('data-drop-over', 'true')
  }
  await press('ArrowUp', 'Later')
  await press('ArrowUp', 'This week')
  await press('ArrowUp', 'Today')
  await page.keyboard.press('ArrowUp')
  await press('ArrowDown', 'This week')
  await press('ArrowDown', 'Later')
  await press('ArrowDown', 'Completed')
  await page.keyboard.press('ArrowDown')
  await expect(headerOf(page, 'Completed')).toHaveAttribute('data-drop-over', 'true')

  // Escape leaves the task where it was.
  await page.keyboard.press('Escape')
  await expect(live).toHaveText('Water the plants was not moved.')
  await expect(rows).toHaveText(atRest)

  // So does dropping before choosing a group.
  await pickUpWith('Enter')
  await page.keyboard.press('Enter')
  await expect(live).toHaveText('Water the plants was not moved.')

  // Three groups up is Today. The handle keeps focus through the move.
  await pickUpWith('Space')
  await press('ArrowUp', 'Later')
  await press('ArrowUp', 'This week')
  await press('ArrowUp', 'Today')
  await page.keyboard.press('Space')
  await expect(live).toHaveText('Water the plants was moved to Today.')
  await expect(rows).toHaveText([header('Today', 2), /Due tonight/, /Water the plants/])
  await expect(handle).toBeFocused()

  await expect.poll(() => puts.bodies.length).toBe(1)
  expect(instant((await savedTask(page, 'Water the plants')).dueAt)).toBe(at.endOfToday)
})

// A keyboard drag jumps from header to header, so the dragged copy glides
// there on the theme's base step, 0.18s. Under the OS setting it does not
// move by itself at all.
for (const { reducedMotion, duration } of [
  { reducedMotion: 'no-preference', duration: '0.18s' },
  { reducedMotion: 'reduce', duration: '0s' },
] as const) {
  test(`with reducedMotion ${reducedMotion} the copy of a task dragged by keyboard glides for ${duration}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await openTasks(page, `drag-motion-${reducedMotion}`)
    await seedTasks(page, [{ title: 'Read the contract' }])
    await page.goto('/tasks')

    await handleOf(page, 'Read the contract').focus()
    await page.keyboard.press('Space')
    await expect(announcer(page)).toHaveText('Picked up Read the contract.')
    // The library's wrapper around the copy is what it moves.
    const wrapper = page.getByTestId('dragged-task').locator('..')
    await expect.poll(() => wrapper.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe(duration)

    // With one task, the header of This week opens exactly where the copy
    // is. The task is still over nothing until an arrow chooses a group, and
    // either way the arrows do.
    await twoFrames(page)
    await expect(page.locator('[data-drop-over]')).toHaveCount(0)
    await page.keyboard.press('ArrowUp')
    await expect(announcer(page)).toHaveText('Read the contract is over Later.')
  })
}
