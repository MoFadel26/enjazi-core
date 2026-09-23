import { Text } from '@mantine/core'
import { SummaryCard } from '../dashboard/SummaryCard'
import { useStreak } from './queries'

export function StreakCard() {
  const { data: streak } = useStreak()
  if (!streak) return <SummaryCard title="Streak" to="/tasks" linkText="Complete a task" />

  const current = Number(streak.currentLength)
  return (
    <SummaryCard title="Streak" to="/tasks" linkText="Complete a task">
      <Text>
        {current}-day streak
        {streak.completedToday ? ', completed today' : ''}
      </Text>
      <Text size="sm" c="dimmed">
        Longest {Number(streak.longestLength)} · {Number(streak.points)} points
      </Text>
      {!streak.completedToday && current > 0 && (
        <Text size="sm" c="orange">
          Complete a task today to keep it.
        </Text>
      )}
    </SummaryCard>
  )
}
