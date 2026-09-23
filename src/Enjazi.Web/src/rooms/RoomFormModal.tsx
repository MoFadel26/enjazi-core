import { Alert, Button, Group, Modal, Stack, Textarea, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { describeError } from '../api/errors'
import { useCreateRoom, useUpdateRoom, type Room } from './queries'

type Props = {
  // null creates a room; a room edits it.
  room: Room | null
  onClose: () => void
  onCreated?: (room: Room) => void
}

export function RoomFormModal({ room, onClose, onCreated }: Props) {
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
    <Modal opened onClose={onClose} title={room ? 'Edit room' : 'New room'}>
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
    </Modal>
  )
}
