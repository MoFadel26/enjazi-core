import { Box, Button, Checkbox, Divider, Flex, Group, Select, Stack, Text, Textarea, TextInput } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { formatDateTime, fromPickerValue, toPickerValue } from '../lib/dates'
import { Icon } from '../ui/Icon'
import { CalendarBlankIcon } from '../ui/icons'
import { priorities, priorityColor, useUpdateTask, type Task, type TaskChanges, type TaskPriority } from './queries'

type Props = {
  task: Task
  onClose: () => void
}

type Values = {
  title: string
  description: string
  priority: TaskPriority
  dueAt: string | null
  completed: boolean
}

// The Edit task dialog's content: the task on the left, its fields on a side
// pane (docs/design.md, Tasks). Nothing is saved until Save.
export function TaskDetails({ task, onClose }: Props) {
  const update = useUpdateTask()
  const form = useForm<Values>({
    initialValues: {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      dueAt: toPickerValue(task.dueAt),
      completed: task.completedAt !== null,
    },
    validate: {
      title: (value) => (value.trim().length > 0 ? null : 'Enter a title'),
    },
  })

  // Only what was edited: the rest comes from the server's copy when the
  // request is built, so a change still pending elsewhere is not re-sent.
  // A failure is reported by useUpdateTask's notification.
  function submit(values: Values) {
    const changes: TaskChanges = {}
    if (form.isDirty('title')) changes.title = values.title.trim()
    if (form.isDirty('description')) changes.description = values.description.trim() || null
    if (form.isDirty('priority')) changes.priority = values.priority
    if (form.isDirty('dueAt')) changes.dueAt = fromPickerValue(values.dueAt)
    if (form.isDirty('completed')) changes.completed = values.completed
    update.mutate({ id: task.id, changes }, { onSuccess: onClose })
  }

  const done = form.values.completed

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <Flex direction={{ base: 'column', sm: 'row' }} mih={280}>
        <Stack flex={1} p="md">
          <Group align="flex-start" gap="sm" wrap="nowrap">
            {/* mt centres the circle on the title's line, which is the lg
                input height (50px) against the md checkbox (24px). */}
            <Checkbox
              radius="xl"
              size="md"
              mt={13}
              aria-label="Completed"
              {...form.getInputProps('completed', { type: 'checkbox' })}
            />
            <Stack flex={1} gap={0}>
              <TextInput
                variant="unstyled"
                size="lg"
                aria-label="Title"
                data-autofocus
                styles={{ input: { fontWeight: 600, textDecoration: done ? 'line-through' : undefined } }}
                c={done ? 'dimmed' : undefined}
                {...form.getInputProps('title')}
              />
              <Textarea
                variant="unstyled"
                aria-label="Description"
                placeholder="Description"
                autosize
                minRows={3}
                {...form.getInputProps('description')}
              />
            </Stack>
          </Group>
        </Stack>

        {/* A hairline parts the panes, beside on wide screens and above on
            narrow ones: in some dark palettes surface-2 is the raised
            surface itself. */}
        <Divider orientation="vertical" visibleFrom="sm" />
        <Divider hiddenFrom="sm" />
        <Stack w={{ base: '100%', sm: 260 }} p="md" gap="sm" bg="var(--enjazi-surface-2)">
          <DateTimePicker
            label="Due"
            variant="unstyled"
            placeholder="No date"
            clearable
            valueFormat="D MMM YYYY HH:mm"
            leftSection={<Icon icon={CalendarBlankIcon} />}
            leftSectionPointerEvents="none"
            {...form.getInputProps('dueAt')}
          />
          <Divider />
          <Select
            label="Priority"
            variant="unstyled"
            data={priorities}
            allowDeselect={false}
            leftSection={<Box component="span" w={6} h={6} bdrs="50%" bg={`${priorityColor[form.values.priority]}.6`} />}
            leftSectionPointerEvents="none"
            {...form.getInputProps('priority')}
          />
          <Divider />
          <Text size="xs" c="dimmed">
            Created {formatDateTime(task.createdAt)}
            <br />
            Updated {formatDateTime(task.updatedAt)}
          </Text>
        </Stack>
      </Flex>
      <Divider />
      <Group justify="flex-end" p="md">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={update.isPending}>
          Save
        </Button>
      </Group>
    </form>
  )
}
