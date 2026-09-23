import type { EventInput } from '@fullcalendar/react'
import dayjs from 'dayjs'
import type { CalendarEvent, EventBody } from './queries'

// The typed boundary between the API shape and FullCalendar. EventInput ends
// in an `any` index signature, so a misspelled field compiles and silently
// becomes custom data; nothing else in the app builds these objects. ADR-0004.
//
// FullCalendar parses ISO-8601 strings itself, so timed events go straight
// across. All-day events are stored as the instants of local midnight, which
// is what a selection in the all-day row hands over. They go back in as
// dates: a "Z" instant is converted to the browser's zone before the time is
// dropped, and west of UTC that lands on the previous day.
export function toEventInput(event: CalendarEvent): EventInput {
  return {
    id: event.id,
    title: event.title,
    allDay: event.allDay,
    start: event.allDay ? dayjs(event.startsAt).format('YYYY-MM-DD') : event.startsAt,
    end: event.allDay ? dayjs(event.endsAt).format('YYYY-MM-DD') : event.endsAt,
  }
}

// The body for a drag or a resize. PUT replaces the whole event, so the
// untouched fields are copied from what the API last sent. `end` is null for
// a zero-length event, in which case it ends when it starts.
export function movedBody(event: CalendarEvent, start: Date | null, end: Date | null): EventBody {
  if (!start) throw new Error(`event ${event.id} moved without a start`)
  return {
    title: event.title,
    description: event.description,
    allDay: event.allDay,
    startsAt: start.toISOString(),
    endsAt: (end ?? start).toISOString(),
  }
}
