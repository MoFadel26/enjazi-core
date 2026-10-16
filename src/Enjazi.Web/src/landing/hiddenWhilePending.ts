import type { CSSProperties } from 'react'

// useCurrentUser is pending until Clerk has loaded and /me has answered,
// which takes about a second. Until then the signed-out actions render
// invisible: a signed-in visitor never sees them flash before "Launch App",
// and a signed-out one sees nothing move when they appear. Invisible content
// is also out of the tab order and the accessibility tree. If /me fails the
// query is no longer pending, and the signed-out actions show.
export function hiddenWhilePending(isPending: boolean): CSSProperties | undefined {
  return isPending ? { visibility: 'hidden' } : undefined
}
