import type { components } from './schema'

type Problem = components['schemas']['ValidationProblemDetails']

// The API answers failures with ProblemDetails, and validation failures with
// an `errors` map on top. Turn whichever arrived into one sentence for an
// Alert or a notification.
export function describeError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const problem = error as Problem
    const reasons = Object.values(problem.errors ?? {}).flat()
    if (reasons.length > 0) return reasons.join(' ')
    if (problem.detail) return problem.detail
    if (problem.title) return problem.title
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
