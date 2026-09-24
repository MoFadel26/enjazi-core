import { ActionIcon, Box, Checkbox, Group, Table, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconChecklist, IconPencil, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { describeError } from '../api/errors'
import { formatDateTime } from '../lib/dates'
import { EmptyState } from '../ui/EmptyState'
import { toUpdateRequest, useDeleteTask, useUpdateTask, type Task, type TaskPriority } from './queries'

// Priority markers per docs/design.md: the accent marks Medium, red marks High.
const priorityColor: Record<TaskPriority, string> = { Low: 'gray', Medium: 'lavender', High: 'red' }

type Props = {
  tasks: Task[]
  onEdit: (task: Task) => void
}

export function TaskList({ tasks, onEdit }: Props) {
  const update = useUpdateTask()
  const remove = useDeleteTask()
  // Read once per mount: a value that changes on every render would make
  // the same render produce different output.
  const [now] = useState(() => Date.now())

  function fail(error: unknown) {
    notifications.show({ color: 'red', message: describeError(error) })
  }

  function toggle(task: Task, completed: boolean) {
    update.mutate({ params: { path: { id: task.id } }, body: toUpdateRequest(task, { completed }) }, { onError: fail })
  }

  function confirmDelete(task: Task) {
    modals.openConfirmModal({
      title: 'Delete task',
      children: <Text size="sm">Delete "{task.title}"? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate({ params: { path: { id: task.id } } }, { onError: fail }),
    })
  }

  if (tasks.length === 0) {
    // No action here: the header's "New task" is the only button by that name.
    return <EmptyState icon={<IconChecklist size={20} stroke={1.75} />} title="No tasks here." />
  }

  return (
    <Table>
      <Table.Tbody>
        {tasks.map((task) => {
          const done = task.completedAt !== null
          const overdue = !done && task.dueAt !== null && Date.parse(task.dueAt) < now
          return (
            <Table.Tr key={task.id}>
              <Table.Td w={40}>
                <Checkbox
                  aria-label={`Complete ${task.title}`}
                  checked={done}
                  onChange={(event) => toggle(task, event.currentTarget.checked)}
                />
              </Table.Td>
              <Table.Td>
                <Text td={done ? 'line-through' : undefined} c={done ? 'dimmed' : undefined}>
                  {task.title}
                </Text>
                {task.description && (
                  <Text size="sm" c="dimmed" lineClamp={1}>
                    {task.description}
                  </Text>
                )}
              </Table.Td>
              <Table.Td w={110}>
                <Group gap="xs" wrap="nowrap">
                  <Box component="span" w={6} h={6} bdrs="50%" bg={`${priorityColor[task.priority]}.6`} />
                  <Text size="sm">{task.priority}</Text>
                </Group>
              </Table.Td>
              <Table.Td w={200}>
                {task.dueAt && (
                  <Text size="sm" c={overdue ? 'red' : 'dimmed'}>
                    {formatDateTime(task.dueAt)}
                  </Text>
                )}
              </Table.Td>
              <Table.Td w={90}>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                  <ActionIcon aria-label="Edit" onClick={() => onEdit(task)}>
                    <IconPencil size={18} stroke={1.75} />
                  </ActionIcon>
                  <ActionIcon aria-label="Delete" color="red" onClick={() => confirmDelete(task)}>
                    <IconTrash size={18} stroke={1.75} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
