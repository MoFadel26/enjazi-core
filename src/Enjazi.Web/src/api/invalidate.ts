import { useQueryClient } from '@tanstack/react-query'

// openapi-react-query keys every query as [method, path, init], with the path
// still holding its template ("/api/rooms/{id}"), so a prefix on the second
// element covers a list and its items together. Used after every mutation:
// the server is the source of truth, so refetch rather than patch the cache.
export function useInvalidate(pathPrefix: string) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) => typeof queryKey[1] === 'string' && queryKey[1].startsWith(pathPrefix),
    })
}
