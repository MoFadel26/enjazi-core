import type { DateSelectInfo, EventDropInfo, EventResizeDoneInfo } from '@fullcalendar/react'
import { Alert, Box, Button, Group, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { describeError } from '../api/errors'
import { EventFormModal, type EventFormTarget } from './EventFormModal'
import { WeekCalendar } from './WeekCalendar'
import { movedBody, toEventInput } from './adapter'
import { useEvents, useUpdateEvent, type EventRange } from './queries'

export function CalendarScreen() {
  const [range, setRange] = useState<EventRange | null>(null)
  const [target, setTarget] = useState<EventFormTarget | null>(null)
  const { data: events, error } = useEvents(range)
  const update = useUpdateEvent()

  const inputs = useMemo(() => (events ?? []).map(toEventInput), [events])

  function newEvent() {
    const start = dayjs().add(1, 'hour').startOf('hour')
    setTarget({
      kind: 'new',
      initial: { title: '', description: null, allDay: false, startsAt: start.toISOString(), endsAt: start.add(1, 'hour').toISOString() },
    })
  }

  function select(info: DateSelectInfo) {
    setTarget({
      kind: 'new',
      initial: { title: '', description: null, allDay: info.allDay, startsAt: info.start.toISOString(), endsAt: info.end.toISOString() },
    })
  }

  function edit(id: string) {
    const event = events?.find((e) => e.id === id)
    if (event) setTarget({ kind: 'edit', event })
  }

  // The grid has already moved the event when this fires. Persist the move;
  // if the API refuses, put it back where the database still has it.
  function move(info: EventDropInfo | EventResizeDoneInfo) {
    const event = events?.find((e) => e.id === info.event.id)
    if (!event) return info.revert()
    update.mutate(
      { params: { path: { id: event.id } }, body: movedBody(event, info.event.start, info.event.end) },
      {
        onError: (err) => {
          info.revert()
          notifications.show({ color: 'red', message: describeError(err) })
        },
      },
    )
  }

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Calendar</Title>
        <Button onClick={newEvent}>New event</Button>
      </Group>
      {error && (
        <Alert color="red" mb="md">
          {describeError(error)}
        </Alert>
      )}
      <Box h="calc(100vh - 160px)">
        <WeekCalendar events={inputs} onRangeChange={setRange} onSelect={select} onEventClick={edit} onEventMove={move} />
      </Box>
      {target && <EventFormModal target={target} onClose={() => setTarget(null)} />}
    </>
  )
}
