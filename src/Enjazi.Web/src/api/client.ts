import createFetchClient from 'openapi-fetch'
import createQueryClient from 'openapi-react-query'
import type { paths } from './schema'
import { queryClient } from '../queryClient'
import { currentUserKey } from '../auth/keys'

// Paths are relative: the Vite dev server proxies /api to the API, and in
// production the two are served from one host. The cookie rides along.
export const fetchClient = createFetchClient<paths>()

// A 401 from anything but the auth endpoints means the cookie expired or was
// dropped server-side. Marking the current user as signed out makes
// RequireAuth redirect on the next render, wherever the 401 came from.
// Login and /me produce 401 as a normal answer, so they are excluded.
fetchClient.use({
  onResponse({ request, response }) {
    if (response.status === 401 && !new URL(request.url).pathname.startsWith('/api/auth/')) {
      queryClient.setQueryData(currentUserKey, null)
    }
  },
})

// Typed useQuery/useMutation over every operation in the OpenAPI document.
export const api = createQueryClient(fetchClient)
