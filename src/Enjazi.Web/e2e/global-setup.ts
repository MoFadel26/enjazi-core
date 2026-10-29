import { clerkSetup } from '@clerk/testing/playwright'

// Fetches a Clerk testing token, which lets the browser past Clerk's bot
// protection. Needs CLERK_SECRET_KEY; see playwright.config.ts.
export default async function globalSetup() {
  await clerkSetup({ publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY })
}
