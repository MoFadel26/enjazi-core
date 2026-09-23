import { keepPreviousData } from '@tanstack/react-query'
import { api } from '../api/client'
import { useInvalidate } from '../api/invalidate'
import type { components } from '../api/schema'

export type CalendarEvent = components['schemas']['EventResponse']
// Create and Update carry the same fields; one name for both bodies.
export type EventBody = components['schemas']['CreateEventRequest']
export type EventRange = { from: string; to: string }

// The window comes from the calendar (datesSet), so the first render has no
// range yet and asks for nothing. keepPreviousData holds the last week on
// screen while the next one loads instead of blanking the grid.
export function useEvents(range: EventRange | null) {
  return api.useQuery(
    'get',
    '/api/events',
    { params: { query: range ?? undefined } },
    { enabled: range !== null, placeholderData: keepPreviousData },
  )
}

export function useCreateEvent() {
  const invalidate = useInvalidate('/api/events')
  return api.useMutation('post', '/api/events', { onSuccess: invalidate })
}

export function useUpdateEvent() {
  const invalidate = useInvalidate('/api/events')
  return api.useMutation('put', '/api/events/{id}', { onSuccess: invalidate })
}

export function useDeleteEvent() {
  const invalidate = useInvalidate('/api/events')
  return api.useMutation('delete', '/api/events/{id}', { onSuccess: invalidate })
}
