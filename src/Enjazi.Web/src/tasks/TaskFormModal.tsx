import { Alert, Button, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { describeError } from '../api/errors'
import { fromPickerValue } from '../lib/dates'
import { useLastDefined } from '../lib/useLastDefined'
import { hairline } from '../theme/refs'
import { priorities, useCreateTask, type Task, type TaskPriority } from './queries'
import { TaskDetails } from './TaskDetails'

type Props = {
  // undefined: closed. null: creating. A task: editing it.
  task: Task | null | undefined
  onClose: () => void
}

type FormValues = {
  title: string
  description: string
  priority: TaskPriority
  dueAt: string | null
}

// Editing is two panes edge to edge, so the body has no padding of its own
// and a hairline parts it from the header.
const detailsStyles = {
  header: { borderBottom: `1px solid ${hairline}` },
  body: { padding: 0 },
}

// Always mounted, so Mantine's transition plays on open and close. Closing
// clears `task` at once; the last one is kept to show while the modal leaves.
// The form lives in the modal's content, which Mantine unmounts once closed,
// so every opening starts from fresh values.
export function TaskFormModal({ task, onClose }: Props) {
  const current = useLastDefined(task)

  return (
    <Modal
      opened={task !== undefined}
      onClose={onClose}
      title={current ? 'Edit task' : 'New task'}
      size={current ? 'xl' : 'md'}
      styles={current ? detailsStyles : undefined}
    >
      {current ? <TaskDetails key={current.id} task={current} onClose={onClose} /> : <NewTaskForm onClose={onClose} />}
    </Modal>
  )
}

function NewTaskForm({ onClose }: { onClose: () => void }) {
  const create = useCreateTask()

  const form = useForm<FormValues>({
    initialValues: { title: '', description: '', priority: 'Medium', dueAt: null },
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
    create.mutate({ body }, { onSuccess: onClose })
  }

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <Stack>
        <TextInput label="Title" data-autofocus {...form.getInputProps('title')} />
        <Textarea label="Description" autosize minRows={2} {...form.getInputProps('description')} />
        <Select label="Priority" data={priorities} allowDeselect={false} {...form.getInputProps('priority')} />
        <DateTimePicker label="Due" clearable valueFormat="D MMM YYYY HH:mm" {...form.getInputProps('dueAt')} />
        {create.isError && <Alert color="red">{describeError(create.error)}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Create
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
