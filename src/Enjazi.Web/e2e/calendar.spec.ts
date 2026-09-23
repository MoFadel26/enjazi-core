import { expect, test } from '@playwright/test'
import { registerAndSignIn } from './session.js'

test('events can be created, edited, dragged and deleted', async ({ page }) => {
  const user = await registerAndSignIn(page, 'calendar')
  await page.goto('/calendar')

  await page.getByRole('button', { name: 'New event' }).click()
  await page.getByLabel('Title').fill('Phase 5 review')
  await page.getByRole('button', { name: 'Create' }).click()
  const event = page.getByText('Phase 5 review')
  await expect(event).toBeVisible()

  // Clicking an event opens it for editing.
  await event.click()
  await page.getByLabel('Title').fill('Phase 5 review, moved')
  await page.getByRole('button', { name: 'Save' }).click()
  const moved = page.getByText('Phase 5 review, moved')
  await expect(moved).toBeVisible()

  // Drag it down the grid and check the API, not the screen, saw the move.
  const before = await currentEvent(page, user.email)
  const box = (await moved.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + 8)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(box.x + box.width / 2, box.y + 8 + step * 12)
  }
  await page.mouse.up()
  await expect.poll(async () => (await currentEvent(page, user.email)).startsAt).not.toBe(before.startsAt)

  await moved.click()
  await page.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog', { name: 'Delete event' }).getByRole('button', { name: 'Delete' }).click()
  await expect(moved).toHaveCount(0)
})

// Asked from inside the page: Playwright's own request context does not send
// the Secure cookie over plain http, the browser on 127.0.0.1 does.
async function currentEvent(page: import('@playwright/test').Page, email: string) {
  const events = await page.evaluate(async () => {
    const response = await fetch('/api/events')
    return (await response.json()) as { title: string; startsAt: string }[]
  })
  const event = events.find((e) => e.title.startsWith('Phase 5 review'))
  if (!event) throw new Error(`no event for ${email}`)
  return event
}
