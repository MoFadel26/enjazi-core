import { defineConfig } from '@playwright/test'

// Drives the real app against the real API: the dev server is started here,
// the API must already be listening on 5180 (scripts/verify-phase-4.sh does
// both). Nothing is mocked.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
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
