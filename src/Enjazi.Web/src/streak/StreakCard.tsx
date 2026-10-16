import { Box, Group, Text } from '@mantine/core'
import { Icon } from '../ui/Icon'
import { StatCard } from '../ui/StatCard'
import { FireIcon, StarIcon, type Glyph } from '../ui/icons'
import { useStreak } from './queries'
import { WeekRow } from './WeekRow'

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

// One of the tile's two big figures: icon, number, unit. The value sits
// inside an h2, so everything here has to be span-based. Group drops falsy
// children, and a count of 0 is one, hence the String.
function Figure({ icon, count, unit }: { icon: Glyph; count: number; unit: string }) {
  return (
    <Group component="span" gap="xs" wrap="nowrap">
      <Box component="span" display="inline-flex" c={count > 0 ? 'accent' : 'dimmed'}>
        <Icon icon={icon} />
      </Box>
      {String(count)}
      <Text component="span" size="sm" fw={500} c="dimmed">
        {unit}
      </Text>
    </Group>
  )
}

// The streak and the points side by side, at the same size: the points are
// what a completion earns, so they are a figure, not a footnote.
export function StreakCard() {
  const { data: streak } = useStreak()
  const current = streak?.currentLength ?? 0
  const points = streak?.points ?? 0

  const value = (
    <Group component="span" gap="lg" wrap="wrap">
      <Figure icon={FireIcon} count={current} unit={current === 1 ? 'day' : 'days'} />
      <Figure icon={StarIcon} count={points} unit={points === 1 ? 'point' : 'points'} />
    </Group>
  )

  const rows = streak
    ? [
        <WeekRow key="week" streak={streak} />,
        <Text key="streak" size="sm">
          {current}-day streak{streak.completedToday ? ', completed today' : ''}
        </Text>,
        <Text key="longest" size="sm" c="dimmed">
          Longest streak {plural(streak.longestLength, 'day', 'days')}
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

  return <StatCard label="Streak · Points" value={value} rows={rows} footer={{ to: '/tasks', label: 'Complete a task' }} />
}
