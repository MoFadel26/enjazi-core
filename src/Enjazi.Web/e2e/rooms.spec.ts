import { expect, test } from '@playwright/test'
import { registerAndSignIn } from './session.js'

test('a room is created, joined by someone else, and administered by its creator', async ({ browser }) => {
  const creator = await browser.newPage()
  const joiner = await browser.newPage()
  await registerAndSignIn(creator, 'creator')
  const joinerAccount = await registerAndSignIn(joiner, 'joiner')
  const name = `Phase 5 room ${Date.now()}`

  await creator.goto('/rooms')
  await creator.getByRole('button', { name: 'New room' }).click()
  await creator.getByLabel('Name').fill(name)
  await creator.getByRole('button', { name: 'Create' }).click()
  await expect(creator).toHaveURL(/\/rooms\/[0-9a-f-]{36}$/)
  await expect(creator.getByRole('heading', { name })).toBeVisible()
  await expect(creator.getByRole('row').filter({ hasText: 'Phase Five creator' })).toContainText('Admin')

  // Visible to a non-member, joinable, and its members are visible after.
  await joiner.goto('/rooms')
  const card = joiner.locator('.mantine-Card-root').filter({ hasText: name })
  await expect(card).toContainText('1 member')
  await card.getByRole('button', { name: 'Join' }).click()
  await card.getByRole('link', { name: 'Open' }).click()
  await expect(joiner.getByRole('row').filter({ hasText: joinerAccount.displayName })).toContainText('Member')
  // A plain member administers nothing.
  await expect(joiner.getByRole('button', { name: 'Edit' })).toHaveCount(0)
  await expect(joiner.getByRole('button', { name: 'Leave' })).toBeVisible()

  // The creator removes them, renames the room, then deletes it.
  await creator.reload()
  const joinerRow = creator.getByRole('row').filter({ hasText: joinerAccount.displayName })
  await joinerRow.getByRole('button', { name: 'Remove' }).click()
  await creator.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
  await expect(joinerRow).toHaveCount(0)

  await creator.getByRole('button', { name: 'Edit' }).click()
  await creator.getByLabel('Name').fill(`${name} renamed`)
  await creator.getByRole('button', { name: 'Save' }).click()
  await expect(creator.getByRole('heading', { name: `${name} renamed` })).toBeVisible()

  await creator.getByRole('button', { name: 'Delete' }).click()
  await creator.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(creator).toHaveURL('/rooms')
  await expect(creator.getByText(`${name} renamed`)).toHaveCount(0)
})
