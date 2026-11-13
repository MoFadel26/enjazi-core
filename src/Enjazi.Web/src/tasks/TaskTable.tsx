import { useDndContext } from '@dnd-kit/core'
import { Table } from '@mantine/core'
import { AnimatePresence } from 'motion/react'
import type { ComponentProps } from 'react'
import { withDropTargets, type TaskGroup } from './grouping'
import { TaskGroupHeader } from './TaskGroupHeader'
import { TaskRow } from './TaskRow'
import type { GroupDrop } from './useGroupDrop'

type Props = Pick<ComponentProps<typeof TaskRow>, 'onToggle' | 'onRename' | 'onEdit' | 'onDelete'> & {
  groups: TaskGroup[]
  dropOn: (group: TaskGroup) => GroupDrop
}

// One table for every group, so rows keep their columns and can move between
// groups. Inside TaskList's DndContext, which it reads.
export function TaskTable({ groups, dropOn, ...handlers }: Props) {
  // While a task is dragged the groups with no tasks show too, as drop
  // targets, and the rows slide to make room. Not before dnd-kit has measured
  // the dragged copy: it places the copy where it finds the row, which has to
  // be under the pointer, where the row was when it was picked up.
  const { active, dragOverlay } = useDndContext()
  const shown = active && dragOverlay.rect ? withDropTargets(groups) : groups

  return (
    <Table>
      <Table.Tbody>
        {/* initial={false}: the rows of the first render are already in place. */}
        <AnimatePresence initial={false}>
          {shown.flatMap((group) => {
            const drop = dropOn(group)
            return [
              <TaskGroupHeader key={group.key} label={group.label} count={group.tasks.length} drop={drop} />,
              ...group.tasks.map((task) => (
                <TaskRow key={task.id} task={task} overdue={group.key === 'overdue'} drop={drop} {...handlers} />
              )),
            ]
          })}
        </AnimatePresence>
      </Table.Tbody>
    </Table>
  )
}
