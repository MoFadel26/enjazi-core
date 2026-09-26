import { Alert, Button, Checkbox, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { describeError } from '../api/errors'
import { fromPickerValue, toPickerValue } from '../lib/dates'
import { useLastDefined } from '../lib/useLastDefined'
import { priorities, useCreateTask, useUpdateTask, type Task, type TaskChanges, type TaskPriority } from './queries'

type Props = {
  // undefined: closed. null: creating. A task: editing it.
  task: Task | null | undefined
  onClose: () => void
}

type FormProps = {
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

// Always mounted, so Mantine's transition plays on open and close. Closing
// clears `task` at once; the last one is kept to show while the modal leaves.
// The form lives in the modal's content, which Mantine unmounts once closed,
// so every opening starts from fresh values.
export function TaskFormModal({ task, onClose }: Props) {
  const current = useLastDefined(task)

  return (
    <Modal opened={task !== undefined} onClose={onClose} title={current ? 'Edit task' : 'New task'}>
      <TaskForm key={current?.id ?? 'new'} task={current ?? null} onClose={onClose} />
    </Modal>
  )
}

function TaskForm({ task, onClose }: FormProps) {
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
    if (task) {
      // Only what was edited: the rest comes from the server's copy when the
      // request is built, so a change still pending elsewhere is not re-sent.
      const changes: TaskChanges = {}
      if (form.isDirty('title')) changes.title = values.title.trim()
      if (form.isDirty('description')) changes.description = values.description.trim() || null
      if (form.isDirty('priority')) changes.priority = values.priority
      if (form.isDirty('dueAt')) changes.dueAt = fromPickerValue(values.dueAt)
      if (form.isDirty('completed')) changes.completed = values.completed
      update.mutate({ id: task.id, changes }, { onSuccess: onClose })
    } else {
      const body = {
        title: values.title.trim(),
        description: values.description.trim() || null,
        priority: values.priority,
        dueAt: fromPickerValue(values.dueAt),
      }
      create.mutate({ body }, { onSuccess: onClose })
    }
  }

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <Stack>
        <TextInput label="Title" data-autofocus {...form.getInputProps('title')} />
        <Textarea label="Description" autosize minRows={2} {...form.getInputProps('description')} />
        <Select label="Priority" data={priorities} allowDeselect={false} {...form.getInputProps('priority')} />
        <DateTimePicker label="Due" clearable valueFormat="D MMM YYYY HH:mm" {...form.getInputProps('dueAt')} />
        {task && <Checkbox label="Completed" {...form.getInputProps('completed', { type: 'checkbox' })} />}
        {/* An edit's failure is reported by useUpdateTask's notification. */}
        {!task && create.isError && <Alert color="red">{describeError(create.error)}</Alert>}
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
  )
}
