import { Group, Table, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { AnimatePresence } from 'motion/react'
import { Eyebrow } from '../ui/Eyebrow'
import { columnCount } from './columns'
import type { TaskGroup } from './grouping'
import { useDeleteTask, useUpdateTask, type Task, type TaskChanges } from './queries'
import { MotionTr, rowMotion } from './rowMotion'
import { TaskRow } from './TaskRow'

type Props = {
  groups: TaskGroup[]
  onEdit: (task: Task) => void
  // Called when a box is ticked, before the update, so the row lingers.
  onComplete: (id: string) => void
}

// One table for every group, so rows keep their columns and can move between
// groups. Failures are reported by the mutation hooks.
export function TaskList({ groups, onEdit, onComplete }: Props) {
  const update = useUpdateTask()
  const remove = useDeleteTask()

  function save(task: Task, changes: TaskChanges) {
    update.mutate({ id: task.id, changes })
  }

  function toggle(task: Task, completed: boolean) {
    if (completed) onComplete(task.id)
    save(task, { completed })
  }

  function confirmDelete(task: Task) {
    modals.openConfirmModal({
      title: 'Delete task',
      children: <Text size="sm">Delete "{task.title}"? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate({ id: task.id }),
    })
  }

  return (
    <Table>
      <Table.Tbody>
        {/* initial={false}: the rows of the first render are already in place. */}
        <AnimatePresence initial={false}>
          {groups.flatMap((group) => [
            <GroupHeader key={group.key} label={group.label} count={group.tasks.length} />,
            ...group.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                overdue={group.key === 'overdue'}
                onToggle={toggle}
                onRename={(item, title) => save(item, { title })}
                onEdit={onEdit}
                onDelete={confirmDelete}
              />
            )),
          ])}
        </AnimatePresence>
      </Table.Tbody>
    </Table>
  )
}

// A row, not a caption, so it enters and leaves with the rows beneath it.
function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <MotionTr {...rowMotion}>
      <Table.Td colSpan={columnCount}>
        <Group gap="xs">
          <Eyebrow>{label}</Eyebrow>
          <Text size="xs" c="dimmed">
            {count}
          </Text>
        </Group>
      </Table.Td>
    </MotionTr>
  )
}
