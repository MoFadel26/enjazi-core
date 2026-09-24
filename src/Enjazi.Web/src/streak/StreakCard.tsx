import { Box, Group, Text } from '@mantine/core'
import { IconFlame } from '@tabler/icons-react'
import { StatCard } from '../ui/StatCard'
import { useStreak } from './queries'

export function StreakCard() {
  const { data: streak } = useStreak()
  const current = Number(streak?.currentLength ?? 0)

  // The value sits inside an h2, so everything here has to be span-based.
  // Group drops falsy children, and a streak of 0 is one, hence the String.
  const value = (
    <Group component="span" gap="xs" wrap="nowrap">
      <Box component="span" display="inline-flex" c={current > 0 ? 'orange' : 'dimmed'}>
        <IconFlame size={20} stroke={1.75} />
      </Box>
      {String(current)}
    </Group>
  )

  const rows = streak
    ? [
        <Text key="streak" size="sm">
          {current}-day streak{streak.completedToday ? ', completed today' : ''}
        </Text>,
        <Text key="longest" size="sm" c="dimmed">
          Longest {Number(streak.longestLength)} · {Number(streak.points)} points
        </Text>,
        ...(!streak.completedToday && current > 0
          ? [
              <Text key="warning" size="sm" c="orange">
                Complete a task today to keep it.
              </Text>,
            ]
          : []),
      ]
    : undefined

  return <StatCard label="Streak" value={value} rows={rows} footer={{ to: '/tasks', label: 'Complete a task' }} />
}
