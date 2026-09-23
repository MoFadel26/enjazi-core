import { keepPreviousData } from '@tanstack/react-query'
import { api } from '../api/client'
import { useInvalidate } from '../api/invalidate'
import type { components } from '../api/schema'

export type AdminUser = components['schemas']['AdminUserResponse']

// The only role the API knows. Roles are set wholesale, so the edit form
// shows a checkbox per known role and sends the checked set.
export const knownRoles = ['Admin'] as const

export const pageSize = 25

// Paging and search are the server's: the API pages the users table, and
// this asks for one page. keepPreviousData keeps the table populated while
// the next page or search loads.
export function useAdminUsers(search: string, page: number) {
  return api.useQuery(
    'get',
    '/api/admin/users',
    { params: { query: { search: search || undefined, page, pageSize } } },
    { placeholderData: keepPreviousData },
  )
}

export function useUpdateAdminUser() {
  const invalidate = useInvalidate('/api/admin/users')
  return api.useMutation('put', '/api/admin/users/{id}', { onSuccess: invalidate })
}
