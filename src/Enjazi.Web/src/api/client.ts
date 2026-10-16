import { getToken } from '@clerk/react'
import createFetchClient from 'openapi-fetch'
import createQueryClient from 'openapi-react-query'
import type { paths } from './schema'
import { queryClient } from '../queryClient'
import { currentUserKey } from '../auth/keys'

// Paths are relative: the Vite dev server proxies /api to the API, and in
// production the two are served from one host.
export const fetchClient = createFetchClient<paths>()

fetchClient.use({
  // The Clerk session token, as a bearer token. getToken refreshes it first
  // when it is about to expire, so a tab left in the background does not send
  // a stale one. ADR-0015.
  async onRequest({ request }) {
    const token = await getToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },

  onResponse({ response }) {
    // Clerk still has a session but the API refuses it: the account was
    // disabled, or the session ended elsewhere. Marking the current user as
    // signed out makes RequireAuth end the Clerk session too, wherever the
    // 401 came from.
    if (response.status === 401) {
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
