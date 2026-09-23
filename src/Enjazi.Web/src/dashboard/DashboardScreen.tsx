import { SimpleGrid, Text, Title } from '@mantine/core'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useCurrentUser } from '../auth/session'
import { useEvents } from '../calendar/queries'
import { formatDateTime } from '../lib/dates'
import { useRooms } from '../rooms/queries'
import { StreakCard } from '../streak/StreakCard'
import { useTasks } from '../tasks/queries'
import { SummaryCard } from './SummaryCard'

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
  const upcoming = (events ?? []).filter((event) => Date.parse(event.endsAt) > now).slice(0, 3)
  const mine = (rooms ?? []).filter((room) => room.isMember)

  return (
    <>
      <Title order={2}>Dashboard</Title>
      <Text c="dimmed" mb="md">
        Signed in as {user?.email}.
      </Text>

      <SimpleGrid cols={{ base: 1, md: 2, xl: 4 }}>
        <StreakCard />
        <SummaryCard title="Tasks" to="/tasks" linkText="All tasks">
          <Text>
            {open.length} open{overdue.length > 0 && <Text span c="red">, {overdue.length} overdue</Text>}
          </Text>
          {open.slice(0, 3).map((task) => (
            <Text key={task.id} size="sm" c="dimmed" lineClamp={1}>
              {task.title}
              {task.dueAt && ` · ${formatDateTime(task.dueAt)}`}
            </Text>
          ))}
        </SummaryCard>

        <SummaryCard title="This week" to="/calendar" linkText="Calendar">
          {upcoming.length === 0 && <Text c="dimmed">Nothing scheduled.</Text>}
          {upcoming.map((event) => (
            <Text key={event.id} size="sm" lineClamp={1}>
              {event.title}
              <Text span c="dimmed">
                {' '}
                · {event.allDay ? dayjs(event.startsAt).format('ddd D MMM') : formatDateTime(event.startsAt)}
              </Text>
            </Text>
          ))}
        </SummaryCard>

        <SummaryCard title="Rooms" to="/rooms" linkText="All rooms">
          <Text>
            {mine.length} joined, {(rooms?.length ?? 0) - mine.length} to join
          </Text>
          {mine.slice(0, 3).map((room) => (
            <Text key={room.id} size="sm" c="dimmed" lineClamp={1}>
              {room.name}
            </Text>
          ))}
        </SummaryCard>
      </SimpleGrid>
    </>
  )
}
