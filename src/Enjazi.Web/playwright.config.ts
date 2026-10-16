import { defineConfig } from '@playwright/test'
import { existsSync } from 'node:fs'

// Clerk keys, neither committed: .env.local holds VITE_CLERK_PUBLISHABLE_KEY
// (clerk env pull writes it), .env.test.local holds CLERK_SECRET_KEY, which
// creates the test users. ADR-0015.
for (const file of ['.env.local', '.env.test.local']) {
  if (existsSync(file)) process.loadEnvFile(file)
}

// Drives the real app against the real API: the dev server is started here,
// the API must already be listening on 5180 (scripts/verify-phase-4.sh does
// both). Nothing is mocked.
export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: false,
  // Every test loads Clerk and signs in against the development instance over
  // the network. With the default of half the cores, those calls queue long
  // enough to time out; two workers pass reliably.
  workers: 2,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5182',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5182',
    reuseExistingServer: true,
  },
})
