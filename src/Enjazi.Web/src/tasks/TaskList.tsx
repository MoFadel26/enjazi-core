import { Badge, Button, Checkbox, Group, Table, Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { describeError } from '../api/errors'
import { formatDateTime } from '../lib/dates'
import { toUpdateRequest, useDeleteTask, useUpdateTask, type Task, type TaskPriority } from './queries'

const priorityColor: Record<TaskPriority, string> = { Low: 'gray', Medium: 'blue', High: 'red' }

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
    return (
      <Text c="dimmed" mt="md">
        No tasks here.
      </Text>
    )
  }

  return (
    <Table verticalSpacing="sm" mt="md">
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
              <Table.Td w={90}>
                <Badge variant="light" color={priorityColor[task.priority]}>
                  {task.priority}
                </Badge>
              </Table.Td>
              <Table.Td w={200}>
                {task.dueAt && (
                  <Text size="sm" c={overdue ? 'red' : 'dimmed'}>
                    {formatDateTime(task.dueAt)}
                  </Text>
                )}
              </Table.Td>
              <Table.Td w={140}>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                  <Button variant="subtle" size="compact-sm" onClick={() => onEdit(task)}>
                    Edit
                  </Button>
                  <Button variant="subtle" size="compact-sm" color="red" onClick={() => confirmDelete(task)}>
                    Delete
                  </Button>
                </Group>
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
