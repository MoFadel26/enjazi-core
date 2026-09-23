import { Alert, Button, Checkbox, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { describeError } from '../api/errors'
import { fromPickerValue, toPickerValue } from '../lib/dates'
import { priorities, useCreateTask, useUpdateTask, type Task, type TaskPriority } from './queries'

type Props = {
  // null creates a task; a task edits it.
  task: Task | null
  onClose: () => void
}

type FormValues = {
  title: string
  description: string
  priority: TaskPriority
  dueAt: string | null
  completed: boolean
}

export function TaskFormModal({ task, onClose }: Props) {
  const create = useCreateTask()
  const update = useUpdateTask()
  const mutation = task ? update : create

  const form = useForm<FormValues>({
    initialValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'Medium',
      dueAt: toPickerValue(task?.dueAt ?? null),
      completed: task?.completedAt != null,
    },
    validate: {
      title: (value) => (value.trim().length > 0 ? null : 'Enter a title'),
    },
  })

  function submit(values: FormValues) {
    const body = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      priority: values.priority,
      dueAt: fromPickerValue(values.dueAt),
    }
    if (task) {
      update.mutate({ params: { path: { id: task.id } }, body: { ...body, completed: values.completed } }, { onSuccess: onClose })
    } else {
      create.mutate({ body }, { onSuccess: onClose })
    }
  }

  return (
    <Modal opened onClose={onClose} title={task ? 'Edit task' : 'New task'}>
      <form onSubmit={form.onSubmit(submit)}>
        <Stack>
          <TextInput label="Title" data-autofocus {...form.getInputProps('title')} />
          <Textarea label="Description" autosize minRows={2} {...form.getInputProps('description')} />
          <Select label="Priority" data={priorities} allowDeselect={false} {...form.getInputProps('priority')} />
          <DateTimePicker label="Due" clearable valueFormat="D MMM YYYY HH:mm" {...form.getInputProps('dueAt')} />
          {task && <Checkbox label="Completed" {...form.getInputProps('completed', { type: 'checkbox' })} />}
          {mutation.error && <Alert color="red">{describeError(mutation.error)}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {task ? 'Save' : 'Create'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
