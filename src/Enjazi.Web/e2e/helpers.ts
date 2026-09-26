import { expect, type Page } from '@playwright/test'
import { registerAndSignIn } from './session.js'

// Helpers shared by the Phase 8 specs.

// A new account, signed in, on the rendered dashboard.
export async function openDashboard(page: Page, label: string) {
  await registerAndSignIn(page, label)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
}

export type Seed = { title: string; dueAt?: string | null; completed?: boolean }

// Creates the tasks one after another, so creation order is the order given,
// and returns their ids. From inside the page: Playwright's request context
// does not send the Secure cookie back over plain http (ADR-0009).
export function seedTasks(page: Page, seeds: Seed[]) {
  return page.evaluate(async (items) => {
    const send = (url: string, method: string, body: object) =>
      fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const ids: string[] = []
    for (const { title, dueAt = null, completed } of items) {
      const fields = { title, description: null, priority: 'Medium', dueAt }
      const created = await send('/api/tasks', 'POST', fields)
      if (!created.ok) throw new Error(`creating "${title}" failed: ${created.status}`)
      const { id } = (await created.json()) as { id: string }
      if (completed) {
        const updated = await send(`/api/tasks/${id}`, 'PUT', { ...fields, completed: true })
        if (!updated.ok) throw new Error(`completing "${title}" failed: ${updated.status}`)
      }
      ids.push(id)
    }
    return ids
  }, seeds)
}

// What the server holds now, read the same way.
export function readTasks(page: Page) {
  return page.evaluate(async () => (await (await fetch('/api/tasks')).json()) as unknown)
}

// Mantine starts a modal's enter transition on the next animation frame, so
// two frames after a key or a render that was going to open one, it is there.
export function twoFrames(page: Page) {
  return page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  )
}

// The helpers below hold requests in the browser until the test releases
// them. "Before it answers" is then a fact of the test, not a race against
// the network, and a loading state lasts as long as the test needs instead of
// one frame.
function deferred() {
  let resolve = () => {}
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

// Holds every GET to one API path until the returned function is called.
export async function holdGet(page: Page, path: string) {
  const release = deferred()
  await page.route(`**${path}`, async (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    await release.promise
    await route.fallback()
  })
  return release.resolve
}

// One step per task write of a method, in the order the page sends them: a
// held write waits for release(its index), then goes through, or is answered
// with a ProblemDetails 500 carrying `fail`. Writes past the plan go through.
export type WriteStep = { hold?: boolean; fail?: string }

export async function routeWrites(page: Page, method: 'PUT' | 'DELETE', plan: WriteStep[]) {
  const bodies: unknown[] = []
  const gates = plan.map(() => deferred())
  await page.route('**/api/tasks/*', async (route) => {
    if (route.request().method() !== method) return route.fallback()
    const index = bodies.push(route.request().postDataJSON()) - 1
    const step = plan.at(index) ?? {}
    if (step.hold) await gates[index].promise
    if (step.fail === undefined) return route.fallback()
    return route.fulfill({
      status: 500,
      contentType: 'application/problem+json',
      body: JSON.stringify({ status: 500, title: step.fail }),
    })
  })
  return { bodies, release: (index: number) => gates[index].resolve() }
}

// The next answer to GET /api/tasks: the refetch after the last write settles.
export function waitForList(page: Page) {
  return page.waitForResponse(
    (response) => response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/tasks',
  )
}
