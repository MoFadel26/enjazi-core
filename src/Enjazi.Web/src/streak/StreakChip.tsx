import { Box, Group, Skeleton, Tooltip, VisuallyHidden } from '@mantine/core'
import { IconFlame } from '@tabler/icons-react'
import { AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { offsets, transitions } from '../theme/motion'
import { useStreak } from './queries'
import { useStreakMoment } from './useStreakMoment'

// The streak in the Tasks header, where completions happen. Not a button:
// there is nothing to do on click, and a name here could collide with the
// page's own buttons (docs/design.md, "Test contract").
export function StreakChip() {
  const { data: streak, isPending } = useStreak()
  const { rise, pop } = useStreakMoment(streak)
  const current = streak?.currentLength ?? 0
  const points = streak?.points ?? 0

  // The Skeleton is the chip's box while loading and, positioned, the
  // anchor the float rises from. It is a progressbar only while loading
  // (docs/design.md, "Loading").
  return (
    <Skeleton
      visible={isPending}
      role={isPending ? 'progressbar' : undefined}
      aria-label={isPending ? 'Loading streak' : undefined}
      width="auto"
      pos="relative"
    >
      <Tooltip label={`${current}-day streak · ${points} points`}>
        <Group gap={4} wrap="nowrap" fw={500} c={current > 0 ? 'orange' : 'dimmed'}>
          {/* Remounted on each growth of the run and swells as it mounts.
              Before any growth there is no animate at all: initial={false}
              would still play when StrictMode remounts it. Reduced motion
              drops the swell. */}
          <Box
            key={pop}
            component={m.span}
            display="inline-flex"
            aria-hidden
            animate={pop === undefined ? undefined : { scale: [1, offsets.pop, 1] }}
            transition={transitions.moment}
          >
            <IconFlame size={18} stroke={1.75} />
          </Box>
          {/* The tooltip is hover-only, so a screen reader gets the line from
              hidden text instead of the bare number. Absent while loading,
              when it would read 0. */}
          <span aria-hidden>{current}</span>
          {streak && <VisuallyHidden>{`${current}-day streak, ${points} points`}</VisuallyHidden>}
        </Group>
      </Tooltip>

      {/* Keyed by the new total, so every completion plays its own float and
          a newer one fades out the one before. The number holds for half the
          moment so it can be read, then fades; reduced motion drops the rise
          and keeps the fade. */}
      <AnimatePresence>
        {rise && (
          <Box
            key={rise.key}
            component={m.div}
            pos="absolute"
            bottom="100%"
            left={0}
            right={0}
            ta="center"
            c="orange"
            fz="sm"
            fw={500}
            aria-hidden
            animate={{ y: -offsets.rise, opacity: [1, 1, 0], transitionEnd: { display: 'none' } }}
            exit={{ opacity: 0 }}
            transition={transitions.moment}
          >
            +{rise.delta}
          </Box>
        )}
      </AnimatePresence>
      {/* Keyed too: the same text again would not change the DOM, and a
          second "+10 points" would go unannounced. */}
      <VisuallyHidden role="status" aria-live="polite">
        {rise && <span key={rise.key}>{`+${rise.delta} points`}</span>}
      </VisuallyHidden>
    </Skeleton>
  )
}
