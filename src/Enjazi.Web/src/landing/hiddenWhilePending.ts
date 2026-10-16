import type { CSSProperties } from 'react'
import { getGuestSession } from '../api/guestSession'

// Whether someone might be signed in, read before Clerk has loaded. Clerk
// keeps __client_uat on the app's domain: "0" once it has seen the browser
// signed out, the sign-in time while signed in, and nothing before a first
// visit. It also writes a copy suffixed with part of its publishable key.
// On a shared parent domain (*.azurecontainerapps.io) the unsuffixed copy
// can belong to another app, so any non-zero copy counts: at worst the
// actions wait for Clerk, as before. A saved guest session counts too.
function mightBeSignedIn() {
  const clerkSession = document.cookie
    .split('; ')
    .map((cookie) => cookie.split('='))
    .some(([name = '', value = '']) => /^__client_uat(_|$)/.test(name) && value !== '' && value !== '0')
  return clerkSession || getGuestSession() !== null
}

// useCurrentUser is pending until Clerk has loaded and /me has answered,
// which takes a second or more. When the browser may be signed in, the
// signed-out actions keep their space but stay invisible until then, so a
// signed-in visitor never sees them flash before "Launch App". When it
// cannot be, they show at once. Invisible content is also out of the tab
// order and the accessibility tree. If /me fails the query is no longer
// pending, and the signed-out actions show.
export function hiddenWhilePending(isPending: boolean): CSSProperties | undefined {
  return isPending && mightBeSignedIn() ? { visibility: 'hidden' } : undefined
}
