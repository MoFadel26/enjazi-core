import { SimpleGrid, Text } from '@mantine/core'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useCurrentUser } from '../auth/session'
import { type CalendarEvent, useEvents } from '../calendar/queries'
import { formatDateTime } from '../lib/dates'
import { useRooms } from '../rooms/queries'
import { StreakCard } from '../streak/StreakCard'
import { type Task, useTasks } from '../tasks/queries'
import { PageHeader } from '../ui/PageHeader'
import { StatCard } from '../ui/StatCard'

// Undated tasks sort last.
function dueOrder(task: Task) {
  return task.dueAt ? Date.parse(task.dueAt) : Number.MAX_SAFE_INTEGER
}

function eventTime(event: CalendarEvent) {
  return event.allDay ? dayjs(event.startsAt).format('ddd D MMM') : formatDateTime(event.startsAt)
}

// Three summaries over the same queries the screens use, so a change made on
// any screen is already in the cache when the dashboard renders again.
export function DashboardScreen() {
  const { data: user } = useCurrentUser()
  const { data: tasks } = useTasks()
  const { data: rooms } = useRooms()
  // Fixed once per mount so the events query key does not change every second.
  const [week] = useState(() => {
    const today = dayjs().startOf('day')
    return { from: today.toISOString(), to: today.add(7, 'day').toISOString() }
  })
  const { data: events } = useEvents(week)

  // Read once per mount: a value that changes on every render would make
  // the same render produce different output.
  const [now] = useState(() => Date.now())
  const open = (tasks ?? []).filter((task) => task.completedAt === null)
  const overdue = open.filter((task) => task.dueAt !== null && Date.parse(task.dueAt) < now)
  const next = [...open].sort((a, b) => dueOrder(a) - dueOrder(b)).slice(0, 3)
  const upcoming = (events ?? []).filter((event) => Date.parse(event.endsAt) > now)
  const mine = (rooms ?? []).filter((room) => room.isMember)

  return (
    <>
      <PageHeader title="Dashboard" description={<>Signed in as {user?.email}.</>} />

      <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }}>
        <StreakCard />

        <StatCard
          label="Tasks"
          value={open.length}
          rows={[
            ...(overdue.length > 0
              ? [
                  <Text key="overdue" size="sm" c="red">
                    {overdue.length} overdue
                  </Text>,
                ]
              : []),
            ...next.map((task) => (
              <div key={task.id}>
                <Text size="sm" lineClamp={1}>
                  {task.title}
                </Text>
                {task.dueAt && (
                  <Text size="xs" c="dimmed">
                    {formatDateTime(task.dueAt)}
                  </Text>
                )}
              </div>
            )),
          ]}
          footer={{ to: '/tasks', label: 'All tasks' }}
        />

        <StatCard
          label="This week"
          value={upcoming.length}
          rows={
            upcoming.length === 0
              ? [
                  <Text key="empty" size="sm" c="dimmed">
                    Nothing scheduled.
                  </Text>,
                ]
              : upcoming.slice(0, 3).map((event) => (
                  <div key={event.id}>
                    <Text size="sm" lineClamp={1}>
                      {event.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {eventTime(event)}
                    </Text>
                  </div>
                ))
          }
          footer={{ to: '/calendar', label: 'Calendar' }}
        />

        <StatCard
          label="Rooms"
          value={mine.length}
          rows={[
            <Text key="to-join" size="sm" c="dimmed">
              {(rooms?.length ?? 0) - mine.length} to join
            </Text>,
            ...mine.slice(0, 3).map((room) => (
              <Text key={room.id} size="sm" lineClamp={1}>
                {room.name}
              </Text>
            )),
          ]}
          footer={{ to: '/rooms', label: 'All rooms' }}
        />
      </SimpleGrid>
    </>
  )
}
