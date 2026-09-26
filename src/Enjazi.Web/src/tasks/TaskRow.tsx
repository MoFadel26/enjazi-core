import { ActionIcon, Box, Checkbox, Group, Table, Text } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { formatDateTime } from '../lib/dates'
import { columnWidths } from './columns'
import type { Task, TaskPriority } from './queries'
import { MotionTr, rowMotion } from './rowMotion'
import { TaskTitle } from './TaskTitle'

// Priority markers per docs/design.md: the accent marks Medium, red marks High.
const priorityColor: Record<TaskPriority, string> = { Low: 'gray', Medium: 'accent', High: 'red' }

type Props = {
  task: Task
  // In the Overdue group. A lingering completed task there is not red.
  overdue: boolean
  onToggle: (task: Task, completed: boolean) => void
  onRename: (task: Task, title: string) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskRow({ task, overdue, onToggle, onRename, onEdit, onDelete }: Props) {
  const done = task.completedAt !== null
  return (
    <MotionTr {...rowMotion}>
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
            <IconPencil size={18} stroke={1.75} />
          </ActionIcon>
          <ActionIcon aria-label="Delete" color="red" onClick={() => onDelete(task)}>
            <IconTrash size={18} stroke={1.75} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </MotionTr>
  )
}
