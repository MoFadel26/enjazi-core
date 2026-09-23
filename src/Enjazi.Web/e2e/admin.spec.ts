import { expect, test } from '@playwright/test'
import { admin, registerAndSignIn, signIn } from './session.js'

test('an admin lists, searches and disables users; everyone else is sent home', async ({ browser }) => {
  const member = await browser.newPage()
  const account = await registerAndSignIn(member, 'member')

  // Not an admin: no link, and the route bounces.
  await member.goto('/')
  await expect(member.getByRole('link', { name: 'Users' })).toHaveCount(0)
  await member.goto('/admin/users')
  await expect(member).toHaveURL('/')

  const page = await browser.newPage()
  const me = await signIn(page, admin)
  expect(me.roles, `${admin.email} must hold the Admin role; see scripts/verify-phase-5.sh`).toContain('Admin')

  await page.goto('/')
  await page.getByRole('link', { name: 'Users' }).click()
  await expect(page).toHaveURL('/admin/users')
  await expect(page.getByRole('row').filter({ hasText: admin.email })).toBeVisible()

  await page.getByLabel('Search users').fill(account.email)
  const row = page.getByRole('row').filter({ hasText: account.email })
  await expect(row).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: admin.email })).toHaveCount(0)

  await row.click()
  await page.getByLabel('Disabled').check()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(row).toContainText('Disabled')

  // Disabled means the account cannot sign in any more.
  const login = await member.request.post('/api/auth/login', { data: { email: account.email, password: account.password } })
  expect(login.status()).toBe(401)
})
