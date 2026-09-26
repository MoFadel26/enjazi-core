import { Box, Group, Stack, Text } from '@mantine/core'
import * as m from 'motion/react-m'
import { transitions } from '../theme/motion'
import type { Streak } from './queries'
import { lastSevenDays } from './week'

type Props = { streak: Streak }

// Seven dots over their weekday initials, oldest on the left. One image to a
// screen reader, so the dots and letters are hidden from it.
export function WeekRow({ streak }: Props) {
  const { days, alive } = lastSevenDays(streak)
  const inRun = days.filter((day) => day.state === 'run').length

  return (
    <Group role="img" aria-label={`${inRun} of the last 7 days in the current streak`} justify="space-between" wrap="nowrap">
      {days.map((day) => (
        <Stack key={day.key} gap="xs" align="center" aria-hidden>
          <Box
            pos="relative"
            w={10}
            h={10}
            bdrs="50%"
            bg={day.state === 'empty' ? 'var(--enjazi-surface-3)' : undefined}
            bd={day.state === 'today-open' ? `2px solid ${alive ? 'orange' : 'var(--mantine-color-default-border)'}` : undefined}
          >
            {/* The orange fill sits on every dot and scales in when its day
                joins the run. initial={false} keeps the first paint still. */}
            <Box
              component={m.div}
              pos="absolute"
              inset={0}
              bdrs="50%"
              bg="orange"
              initial={false}
              animate={{ scale: day.state === 'run' ? 1 : 0 }}
              transition={transitions.base}
            />
          </Box>
          <Text size="xs" c="dimmed">
            {day.initial}
          </Text>
        </Stack>
      ))}
    </Group>
  )
}
