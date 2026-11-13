import { DragOverlay } from '@dnd-kit/core'
import { Group, Paper, Portal, Text } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { durations, easing } from '../theme/motion'
import { Icon } from '../ui/Icon'
import { DotsSixVerticalIcon } from '../ui/icons'
import type { Task } from './queries'

type Props = { task: Task | undefined }

// The copy of the dragged task that follows the pointer, as wide and as tall
// as its row. The row itself never moves: motion owns its transform. No drop
// animation, because after a drop the row slides to its new group itself.
// In a Portal, so no ancestor can clip it or offset its fixed position.
export function TaskDragOverlay({ task }: Props) {
  const reduceMotion = useReducedMotion()
  // A keyboard drag jumps from header to header, so the copy glides there on
  // the theme's base step instead of dnd-kit's own; a pointer drag must not
  // lag behind the pointer.
  const glide = `transform ${durations.base}ms ${easing}`

  return (
    <Portal>
      <DragOverlay
        dropAnimation={null}
        transition={(activator) => (activator instanceof KeyboardEvent && !reduceMotion ? glide : undefined)}
      >
        {task && (
          <Paper
            data-testid="dragged-task"
            h="100%"
            p={0}
            shadow="md"
            bg="var(--enjazi-surface-raised)"
            style={{ cursor: 'grabbing' }}
          >
            <Group h="100%" px="sm" gap="sm" wrap="nowrap">
              <Icon icon={DotsSixVerticalIcon} />
              <Text truncate>{task.title}</Text>
            </Group>
          </Paper>
        )}
      </DragOverlay>
    </Portal>
  )
}
