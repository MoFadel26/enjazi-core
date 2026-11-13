import { useDraggable } from '@dnd-kit/core'
import { ActionIcon, Box, Checkbox, Group, Table, Text } from '@mantine/core'
import { useMergedRef } from '@mantine/hooks'
import { formatDateTime } from '../lib/dates'
import { Icon } from '../ui/Icon'
import { DotsSixVerticalIcon, PencilSimpleIcon, TrashIcon } from '../ui/icons'
import { columnWidths } from './columns'
import { priorityColor, type Task } from './queries'
import { liftedRow, MotionTr, rowMotion } from './rowMotion'
import { TaskTitle } from './TaskTitle'
import { dragData, useGroupDrop, type GroupDrop } from './useGroupDrop'

type Props = {
  task: Task
  // In the Overdue group. A lingering completed task there is not red.
  overdue: boolean
  // Dropping another task on this row moves it to this row's group.
  drop: GroupDrop
  onToggle: (task: Task, completed: boolean) => void
  onRename: (task: Task, title: string) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskRow({ task, overdue, drop, onToggle, onRename, onEdit, onDelete }: Props) {
  const done = task.completedAt !== null
  // The row is what gets measured and copied into the overlay; the handle is
  // what starts the drag, with the pointer or with Space or Enter.
  const { attributes, listeners, isDragging, setNodeRef, setActivatorNodeRef } = useDraggable({
    id: task.id,
    data: dragData(task),
  })
  const { ref: dropRef, ...target } = useGroupDrop(task.id, drop, false)
  const ref = useMergedRef(setNodeRef, dropRef)

  return (
    <MotionTr {...rowMotion} animate={isDragging ? liftedRow : rowMotion.animate} ref={ref} {...target}>
      <Table.Td w={columnWidths.handle}>
        {/* touchAction: a finger on the handle drags the task, not the page. */}
        <ActionIcon
          ref={setActivatorNodeRef}
          aria-label="Move"
          style={{ cursor: 'grab', touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >
          <Icon icon={DotsSixVerticalIcon} />
        </ActionIcon>
      </Table.Td>
      <Table.Td w={columnWidths.check}>
        <Checkbox
          aria-label={`Complete ${task.title}`}
          checked={done}
          onChange={(event) => onToggle(task, event.currentTarget.checked)}
        />
      </Table.Td>
      <Table.Td>
        <TaskTitle task={task} onRename={(title) => onRename(task, title)} />
        {task.description && (
          <Text size="sm" c="dimmed" lineClamp={1}>
            {task.description}
          </Text>
        )}
      </Table.Td>
      <Table.Td w={columnWidths.priority}>
        <Group gap="xs" wrap="nowrap">
          <Box component="span" w={6} h={6} bdrs="50%" bg={`${priorityColor[task.priority]}.6`} />
          <Text size="sm">{task.priority}</Text>
        </Group>
      </Table.Td>
      <Table.Td w={columnWidths.due}>
        {task.dueAt && (
          <Text size="sm" c={overdue && !done ? 'red' : 'dimmed'}>
            {formatDateTime(task.dueAt)}
          </Text>
        )}
      </Table.Td>
      <Table.Td w={columnWidths.actions}>
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <ActionIcon aria-label="Edit" onClick={() => onEdit(task)}>
            <Icon icon={PencilSimpleIcon} />
          </ActionIcon>
          <ActionIcon aria-label="Delete" color="red" onClick={() => onDelete(task)}>
            <Icon icon={TrashIcon} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </MotionTr>
  )
}
