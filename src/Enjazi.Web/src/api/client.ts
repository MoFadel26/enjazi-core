import createFetchClient from 'openapi-fetch'
import createQueryClient from 'openapi-react-query'
import type { paths } from './schema'
import { queryClient } from '../queryClient'
import { currentUserKey } from '../auth/keys'

// Paths are relative: the Vite dev server proxies /api to the API, and in
// production the two are served from one host. The cookie rides along.
export const fetchClient = createFetchClient<paths>()

fetchClient.use({
  onResponse({ request, response }) {
    // A 401 from anything but the auth endpoints means the cookie expired or
    // was dropped server-side. Marking the current user as signed out makes
    // RequireAuth redirect on the next render, wherever the 401 came from.
    // Login and /me produce 401 as a normal answer, so they are excluded.
    if (response.status === 401 && !new URL(request.url).pathname.startsWith('/api/auth/')) {
      queryClient.setQueryData(currentUserKey, null)
    }

    // NotFound() and a refused policy answer with no body. openapi-fetch
    // parses that to `error: undefined`, and openapi-react-query only throws
    // on a truthy error, so the caller would see success with no data. Give
    // those responses a ProblemDetails body so they fail like the rest.
    if (!response.ok && response.headers.get('Content-Length') === '0') {
      const title = response.status === 404 ? 'Not found.' : `Request failed (${response.status}).`
      return new Response(JSON.stringify({ status: response.status, title }), {
        status: response.status,
        statusText: response.statusText,
        headers: { 'Content-Type': 'application/problem+json' },
      })
    }
    return undefined
  },
})

// Typed useQuery/useMutation over every operation in the OpenAPI document.
export const api = createQueryClient(fetchClient)
