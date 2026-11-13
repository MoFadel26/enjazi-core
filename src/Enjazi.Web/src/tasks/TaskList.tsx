import { DndContext } from '@dnd-kit/core'
import { Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import type { TaskGroup } from './grouping'
import { useDeleteTask, useUpdateTask, type Task, type TaskChanges } from './queries'
import { TaskDragOverlay } from './TaskDragOverlay'
import { TaskTable } from './TaskTable'
import { useTaskDrag } from './useTaskDrag'

type Props = {
  groups: TaskGroup[]
  onEdit: (task: Task) => void
  // Called when a box is ticked, before the update, so the row lingers.
  onComplete: (id: string) => void
}

// The task table with what changes a task: the tick, the rename, the delete
// and a drag onto another group (useTaskDrag), all saved the same way.
// Failures are reported by the mutation hooks.
export function TaskList({ groups, onEdit, onComplete }: Props) {
  const update = useUpdateTask()
  const remove = useDeleteTask()

  function save(task: Task, changes: TaskChanges) {
    update.mutate({ id: task.id, changes })
  }

  const drag = useTaskDrag(groups, save)

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
    <DndContext {...drag.context}>
      <TaskTable
        groups={groups}
        dropOn={drag.dropOn}
        onToggle={toggle}
        onRename={(task, title) => save(task, { title })}
        onEdit={onEdit}
        onDelete={confirmDelete}
      />
      <TaskDragOverlay task={drag.dragged} />
    </DndContext>
  )
}
