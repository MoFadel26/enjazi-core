import { deleteTestUsers } from './session.js'

// Each run creates dozens of Clerk users; without this the development
// instance fills up with them.
export default async function globalTeardown() {
  await deleteTestUsers()
}
