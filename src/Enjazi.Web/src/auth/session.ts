import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '../api/client'
import type { components } from '../api/schema'
import { currentUserKey } from './keys'

export type User = components['schemas']['UserResponse']
type LoginRequest = components['schemas']['LoginRequest']
type RegisterRequest = components['schemas']['RegisterRequest']

// The signed-in user lives in the query cache under one key. null means
// "asked the API and nobody is signed in", which is distinct from undefined
// (not asked yet). Login and register write the user straight into the cache
// so the app never refetches /me to learn what it just received.
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: async (): Promise<User | null> => {
      const { data, response } = await fetchClient.GET('/api/auth/me')
      if (response.status === 401) return null
      if (data === undefined) throw new Error(`GET /api/auth/me returned ${response.status}`)
      return data
    },
    staleTime: Infinity,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: LoginRequest) => {
      const { data, response } = await fetchClient.POST('/api/auth/login', { body })
      if (data === undefined) {
        throw new Error(
          response.status === 401
            ? 'Wrong email or password, or the account is locked.'
            : `Login failed (${response.status}).`,
        )
      }
      return data
    },
    onSuccess: (user) => queryClient.setQueryData(currentUserKey, user),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: RegisterRequest) => {
      const { data, error, response } = await fetchClient.POST('/api/auth/register', { body })
      if (data === undefined) {
        const reasons = Object.values(error?.errors ?? {}).flat()
        throw new Error(reasons.length > 0 ? reasons.join(' ') : `Registration failed (${response.status}).`)
      }
      return data
    },
    onSuccess: (user) => queryClient.setQueryData(currentUserKey, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { response } = await fetchClient.POST('/api/auth/logout')
      if (!response.ok) throw new Error(`Logout failed (${response.status}).`)
    },
    onSuccess: () => {
      // Drop everything the previous user loaded, then record the sign-out.
      queryClient.clear()
      queryClient.setQueryData(currentUserKey, null)
    },
  })
}
