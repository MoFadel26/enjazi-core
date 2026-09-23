import { api } from '../api/client'
import type { components } from '../api/schema'

export type Streak = components['schemas']['StreakResponse']

// Read-only: the streak moves when a task is completed (tasks/queries.ts
// invalidates it), never by a request of its own.
export function useStreak() {
  return api.useQuery('get', '/api/streak')
}
