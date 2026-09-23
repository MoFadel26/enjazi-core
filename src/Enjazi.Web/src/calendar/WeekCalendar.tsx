import Calendar, {
  type DateSelectInfo,
  type EventDropInfo,
  type EventInput,
  type EventResizeDoneInfo,
} from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/react/interaction'
import classicTheme from '@fullcalendar/react/themes/classic'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import './mantine-bridge.css'
import type { EventRange } from './queries'

const plugins = [timeGridPlugin, interactionPlugin, classicTheme]

type Props = {
  events: EventInput[]
  // Fires on mount and on every navigation with the visible window, which
  // is what the events query asks the API for.
  onRangeChange: (range: EventRange) => void
  onSelect: (info: DateSelectInfo) => void
  onEventClick: (id: string) => void
  // Drag and resize both land here. The handler persists the move and must
  // call info.revert() if the API refuses it. ADR-0004.
  onEventMove: (info: EventDropInfo | EventResizeDoneInfo) => void
}

export function WeekCalendar({ events, onRangeChange, onSelect, onEventClick, onEventMove }: Props) {
  return (
    <Calendar
      plugins={plugins}
      initialView="timeGridWeek"
      headerToolbar={{ start: 'title', center: '', end: 'timeGridWeek,timeGridDay prev,today,next' }}
      firstDay={1}
      timeZone="local"
      nowIndicator
      selectable
      editable
      slotDuration="00:30:00"
      snapDuration="00:15:00"
      scrollTime="07:00:00"
      height="100%"
      events={events}
      datesSet={(info) => onRangeChange({ from: info.startStr, to: info.endStr })}
      select={onSelect}
      eventClick={(info) => onEventClick(info.event.id)}
      eventDrop={onEventMove}
      eventResize={onEventMove}
    />
  )
}
