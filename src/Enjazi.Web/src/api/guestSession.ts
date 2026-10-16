import { useSyncExternalStore } from 'react'
import type { components } from './schema'

// The guest session (ADR-0017): the API's own token for a temporary account,
// kept in localStorage so a reload, a second tab and a later sign-up in the
// same browser all find it. A store outside React, like the palette's, so
// the fetch middleware and the hub can read it as well as components.
export type GuestSession = components['schemas']['GuestSessionResponse']

const storageKey = 'enjazi-guest'

// Refresh this long before the token's own expiry.
const refreshMargin = 2 * 60 * 1000

function stored(): GuestSession | null {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as GuestSession | null
    return value !== null && Date.parse(value.expiresAt) > Date.now() ? value : null
  } catch {
    return null
  }
}

let current = stored()
const listeners = new Set<() => void>()

// Set once a session in this page has ended (logged out or expired), so
// RequireAuth sends the visitor to the landing page rather than to sign-in.
let ended = false

export function getGuestSession() {
  return current
}

export function guestSessionEnded() {
  return ended
}

export function setGuestSession(session: GuestSession | null) {
  ended = session === null && (ended || current !== null)
  current = session
  if (session) localStorage.setItem(storageKey, JSON.stringify(session))
  else localStorage.removeItem(storageKey)
  for (const listener of listeners) listener()
}

export function useGuestSession() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => current,
  )
}

// A JWT's exp, in milliseconds. The payload is base64url JSON.
function expiresAt(token: string) {
  try {
    const payload = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/')
    return (JSON.parse(atob(payload)) as { exp: number }).exp * 1000
  } catch {
    return 0
  }
}

let refreshing: Promise<string | null> | null = null

// The guest's bearer token, refreshed first when it is about to expire. The
// API accepts an expired token for refresh while the guest lives, so a tab
// that slept past the 15 minutes keeps its session. Plain fetch, not the
// generated client: the client's middleware calls this. Null, and the
// session cleared, once the guest itself has gone.
export async function guestToken(): Promise<string | null> {
  const session = current
  if (session === null) return null
  if (expiresAt(session.token) - Date.now() > refreshMargin) return session.token

  refreshing ??= (async () => {
    const response = await fetch('/api/auth/guest/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: session.token }),
    })
    if (response.status === 401) {
      setGuestSession(null)
      return null
    }
    if (!response.ok) return session.token
    const next = (await response.json()) as GuestSession
    setGuestSession(next)
    return next.token
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}
