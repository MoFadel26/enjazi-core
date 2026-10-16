import { useAuth, useClerk } from '@clerk/react'
import { notifications } from '@mantine/notifications'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { api, fetchClient } from '../api/client'
import { setGuestSession, useGuestSession } from '../api/guestSession'
import type { components } from '../api/schema'
import { currentUserKey } from './keys'

export type User = components['schemas']['UserResponse']

// Clerk, or a guest session (ADR-0017), says whether someone is signed in;
// the API says who they are here: the local id and roles. The user lives in
// the query cache under one key per kind of session, so signing up from a
// guest session asks again rather than reusing the guest's answer. null means
// signed out, which is distinct from undefined (not known yet).
export function useCurrentUser() {
  const { isLoaded, isSignedIn } = useAuth()
  const guest = useGuestSession()
  const kind = isSignedIn ? 'clerk' : 'guest'
  const query = useQuery({
    queryKey: [...currentUserKey, kind],
    queryFn: async (): Promise<User | null> => {
      const { data, response } = await fetchClient.GET('/api/auth/me')
      if (response.status === 401) return null
      if (data === undefined) throw new Error(`GET /api/auth/me returned ${response.status}`)
      // Signed in to Clerk: any guest data has moved to the account by now
      // (the request carried the guest token), so the guest session is done.
      if (kind === 'clerk') setGuestSession(null)
      return data
    },
    staleTime: Infinity,
    enabled: isSignedIn === true || guest !== null,
  })

  if (!isLoaded) return { data: undefined, isPending: true } as const
  if (!isSignedIn && guest === null) return { data: null, isPending: false } as const
  return query
}

export function useLogout() {
  const clerk = useClerk()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      // A guest leaving drops the token; the account expires on its own.
      setGuestSession(null)
      if (clerk.session) await clerk.signOut()
    },
    // Drop everything the previous user loaded.
    onSuccess: () => queryClient.clear(),
  })
}

// Deletes the account (ADR-0019), then goes to the landing page and leaves
// the way a logout does. The API has deleted the Clerk user by then, so
// ending its session in the browser can fail, and that is not a failure of
// the deletion. All of it is here rather than in a mutate() callback: the
// screen that asked unmounts as the session ends, and TanStack Query drops a
// callback whose component has gone.
export function useDeleteAccount() {
  const clerk = useClerk()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return api.useMutation('delete', '/api/auth/me', {
    onSuccess: async () => {
      await navigate('/landing', { replace: true })
      setGuestSession(null)
      if (clerk.session) await clerk.signOut().catch(() => undefined)
      queryClient.clear()
      notifications.show({ message: 'Your account was deleted.' })
    },
  })
}

// Signed in to Clerk, refused by the API: a disabled account, or a token the
// API does not accept. Ends the Clerk session, so the app does not bounce
// between /login, which sees a session, and screens that cannot load.
// Returns true until that has happened.
export function useEndRefusedSession(user: User | null | undefined) {
  const { isSignedIn } = useAuth()
  const logout = useLogout()
  const refused = isSignedIn === true && user === null
  const { mutate, isIdle } = logout

  useEffect(() => {
    if (refused && isIdle) mutate()
  }, [refused, isIdle, mutate])

  return refused
}
