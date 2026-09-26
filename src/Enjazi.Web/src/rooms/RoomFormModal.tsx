import { Alert, Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { describeError } from '../api/errors'
import { useLastDefined } from '../lib/useLastDefined'
import { useCreateRoom, useUpdateRoom, type Room } from './queries'

type Props = {
  // undefined: closed. null: creating. A room: editing it.
  room: Room | null | undefined
  onClose: () => void
  onCreated?: (room: Room) => void
}

type FormProps = {
  room: Room | null
  onClose: () => void
  onCreated?: (room: Room) => void
}

// Always mounted, so Mantine's transition plays on open and close; the form
// lives in the content Mantine unmounts once closed, so every opening starts
// fresh. TaskFormModal has the same shape.
export function RoomFormModal({ room, onClose, onCreated }: Props) {
  const current = useLastDefined(room)

  return (
    <Modal opened={room !== undefined} onClose={onClose} title={current ? 'Edit room' : 'New room'}>
      <RoomForm key={current?.id ?? 'new'} room={current ?? null} onClose={onClose} onCreated={onCreated} />
    </Modal>
  )
}

function RoomForm({ room, onClose, onCreated }: FormProps) {
  const create = useCreateRoom()
  const update = useUpdateRoom()
  const mutation = room ? update : create

  const form = useForm({
    initialValues: { name: room?.name ?? '', description: room?.description ?? '' },
    validate: { name: (value) => (value.trim().length > 0 ? null : 'Enter a name') },
  })

  function submit(values: typeof form.values) {
    const body = { name: values.name.trim(), description: values.description.trim() || null }
    if (room) {
      update.mutate({ params: { path: { id: room.id } }, body }, { onSuccess: onClose })
    } else {
      create.mutate(
        { body },
        {
          onSuccess: (created) => {
            onClose()
            if (created) onCreated?.(created)
          },
        },
      )
    }
  }

  return (
    <form onSubmit={form.onSubmit(submit)}>
      <Stack>
        <TextInput label="Name" data-autofocus {...form.getInputProps('name')} />
        <Textarea label="Description" autosize minRows={2} {...form.getInputProps('description')} />
        {mutation.error && <Alert color="red">{describeError(mutation.error)}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {room ? 'Save' : 'Create'}
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
