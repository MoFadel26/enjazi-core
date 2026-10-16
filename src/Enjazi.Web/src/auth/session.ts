import { useAuth, useClerk } from '@clerk/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchClient } from '../api/client'
import type { components } from '../api/schema'
import { currentUserKey } from './keys'

export type User = components['schemas']['UserResponse']

// Clerk says whether someone is signed in; the API says who they are here:
// the local id and roles. The user lives in the query cache under one key.
// null means signed out, which is distinct from undefined (not known yet).
export function useCurrentUser() {
  const { isLoaded, isSignedIn } = useAuth()
  const query = useQuery({
    queryKey: currentUserKey,
    queryFn: async (): Promise<User | null> => {
      const { data, response } = await fetchClient.GET('/api/auth/me')
      if (response.status === 401) return null
      if (data === undefined) throw new Error(`GET /api/auth/me returned ${response.status}`)
      return data
    },
    staleTime: Infinity,
    enabled: isSignedIn === true,
  })

  if (!isLoaded) return { data: undefined, isPending: true } as const
  if (!isSignedIn) return { data: null, isPending: false } as const
  return query
}

export function useLogout() {
  const clerk = useClerk()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => clerk.signOut(),
    // Drop everything the previous user loaded.
    onSuccess: () => queryClient.clear(),
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
