import { getToken } from '@clerk/react'
import createFetchClient from 'openapi-fetch'
import createQueryClient from 'openapi-react-query'
import type { paths } from './schema'
import { queryClient } from '../queryClient'
import { currentUserKey } from '../auth/keys'
import { getGuestSession, guestToken, setGuestSession } from './guestSession'

// Paths are relative: the Vite dev server proxies /api to the API, and in
// production the two are served from one host.
export const fetchClient = createFetchClient<paths>()

// The bearer token for the API and the hub: the Clerk session token when
// signed in to Clerk, otherwise the guest's (ADR-0017). Both refresh first
// when about to expire, so a tab left in the background does not send a
// stale one. ADR-0015.
export async function bearerToken() {
  return (await getToken()) ?? (await guestToken())
}

// Requests sent with the guest token, so a 401 on one can end the guest
// session rather than a Clerk one.
const guestRequests = new WeakSet<Request>()

fetchClient.use({
  async onRequest({ request }) {
    const clerkToken = await getToken()
    const token = clerkToken ?? (await guestToken())
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    if (!clerkToken && token) guestRequests.add(request)

    // A guest who has just signed up sends the guest token along with the
    // new Clerk one, and the API moves the guest's data to the account.
    const guest = getGuestSession()
    if (clerkToken && guest) request.headers.set('X-Guest-Token', guest.token)
    return request
  },

  onResponse({ request, response }) {
    // Clerk still has a session but the API refuses it: the account was
    // disabled, or the session ended elsewhere. Marking the current user as
    // signed out makes RequireAuth end the Clerk session too, wherever the
    // 401 came from. A refused guest token means the guest has expired: the
    // session is dropped and the app goes back to the landing page.
    if (response.status === 401) {
      queryClient.setQueriesData({ queryKey: currentUserKey }, null)
      if (guestRequests.has(request)) setGuestSession(null)
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
