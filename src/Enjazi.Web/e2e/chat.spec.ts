import { expect, test } from '@playwright/test'
import { registerAndSignIn } from './session.js'

// The Phase 6 check from docs/plan.md: two browser tabs see each other's
// messages. Two pages in one browser, each its own account, no reloads.
test('two members see each other\'s messages as they are sent', async ({ browser }) => {
  const alice = await (await browser.newContext()).newPage()
  const bob = await (await browser.newContext()).newPage()
  const aliceAccount = await registerAndSignIn(alice, 'alice')
  const bobAccount = await registerAndSignIn(bob, 'bob')
  const name = `Chat ${Date.now()}`

  await alice.goto('/rooms')
  await alice.getByRole('button', { name: 'New room' }).click()
  await alice.getByLabel('Name').fill(name)
  await alice.getByRole('button', { name: 'Create' }).click()
  await expect(alice).toHaveURL(/\/rooms\/[0-9a-f-]{36}$/)
  await expect(alice.getByText('No messages yet.')).toBeVisible()

  await bob.goto('/rooms')
  const card = bob.locator('.mantine-Card-root').filter({ hasText: name })
  await card.getByRole('button', { name: 'Join' }).click()
  await card.getByRole('link', { name: 'Open' }).click()
  await expect(bob.getByText('No messages yet.')).toBeVisible()

  await alice.getByLabel('Message').fill('Hello from Alice')
  await alice.getByRole('button', { name: 'Send' }).click()
  await expect(bob.getByText('Hello from Alice')).toBeVisible()
  await expect(alice.getByText('Hello from Alice')).toBeVisible()

  await bob.getByLabel('Message').fill('Hello from Bob')
  await bob.getByLabel('Message').press('Enter')
  await expect(alice.getByText('Hello from Bob')).toBeVisible()
  await expect(bob.getByText('Hello from Bob')).toBeVisible()

  // Each message is shown once on each side: the sender's own POST response
  // and the pushed copy do not both land.
  await expect(alice.getByTestId('message')).toHaveCount(2)
  await expect(bob.getByTestId('message')).toHaveCount(2)
  await expect(alice.getByTestId('message').first()).toContainText(aliceAccount.displayName)
  await expect(alice.getByTestId('message').last()).toContainText(bobAccount.displayName)

  // History is the server's: a fresh load shows the same two messages.
  await bob.reload()
  await expect(bob.getByTestId('message')).toHaveCount(2)
})
