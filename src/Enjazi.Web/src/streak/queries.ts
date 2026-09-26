import { api } from '../api/client'
import type { components } from '../api/schema'

type StreakResponse = components['schemas']['StreakResponse']

// The schema types the counts number | string, because ASP.NET Core's JSON
// defaults accept numbers written as strings. The API sends numbers; they
// are narrowed once here, so no reader converts them.
export type Streak = Omit<StreakResponse, 'currentLength' | 'longestLength' | 'points'> & {
  currentLength: number
  longestLength: number
  points: number
}

// A module function, so the reference is stable and TanStack Query reruns it
// only when the data changes.
function toStreak(response: StreakResponse): Streak {
  return {
    ...response,
    currentLength: Number(response.currentLength),
    longestLength: Number(response.longestLength),
    points: Number(response.points),
  }
}

// Read-only: the streak moves when a task is completed (tasks/queries.ts
// invalidates it), never by a request of its own.
export function useStreak() {
  return api.useQuery('get', '/api/streak', undefined, { select: toStreak })
}
