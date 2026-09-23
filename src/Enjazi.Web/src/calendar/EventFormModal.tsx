import { Alert, Button, Group, Modal, Stack, Switch, Textarea, TextInput } from '@mantine/core'
import { DateTimePicker } from '@mantine/dates'
import { useForm } from '@mantine/form'
import { modals } from '@mantine/modals'
import dayjs from 'dayjs'
import { describeError } from '../api/errors'
import { fromPickerValue, toPickerValue } from '../lib/dates'
import { useCreateEvent, useDeleteEvent, useUpdateEvent, type CalendarEvent, type EventBody } from './queries'

export type EventFormTarget = { kind: 'new'; initial: EventBody } | { kind: 'edit'; event: CalendarEvent }

type Props = { target: EventFormTarget; onClose: () => void }

type FormValues = { title: string; description: string; allDay: boolean; startsAt: string | null; endsAt: string | null }

export function EventFormModal({ target, onClose }: Props) {
  const create = useCreateEvent()
  const update = useUpdateEvent()
  const remove = useDeleteEvent()
  const source = target.kind === 'new' ? target.initial : target.event
  const saving = target.kind === 'new' ? create : update

  const form = useForm<FormValues>({
    initialValues: {
      title: source.title,
      description: source.description ?? '',
      allDay: source.allDay,
      startsAt: toPickerValue(source.startsAt),
      endsAt: toPickerValue(source.endsAt),
    },
    validate: {
      title: (value) => (value.trim().length > 0 ? null : 'Enter a title'),
      startsAt: (value) => (value ? null : 'Enter a start'),
      endsAt: (value, values) =>
        !value ? 'Enter an end' : dayjs(value).isBefore(dayjs(values.startsAt)) ? 'Ends before it starts' : null,
    },
  })

  function submit(values: FormValues) {
    const body: EventBody = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      allDay: values.allDay,
      startsAt: fromPickerValue(values.startsAt) ?? '',
      endsAt: fromPickerValue(values.endsAt) ?? '',
    }
    if (target.kind === 'edit') {
      update.mutate({ params: { path: { id: target.event.id } }, body }, { onSuccess: onClose })
    } else {
      create.mutate({ body }, { onSuccess: onClose })
    }
  }

  function confirmDelete(event: CalendarEvent) {
    modals.openConfirmModal({
      title: 'Delete event',
      children: `Delete "${event.title}"?`,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => remove.mutate({ params: { path: { id: event.id } } }, { onSuccess: onClose }),
    })
  }

  return (
    <Modal opened onClose={onClose} title={target.kind === 'new' ? 'New event' : 'Edit event'}>
      <form onSubmit={form.onSubmit(submit)}>
        <Stack>
          <TextInput label="Title" data-autofocus {...form.getInputProps('title')} />
          <Textarea label="Description" autosize minRows={2} {...form.getInputProps('description')} />
          <Switch label="All day" {...form.getInputProps('allDay', { type: 'checkbox' })} />
          <DateTimePicker label="Starts" valueFormat="D MMM YYYY HH:mm" {...form.getInputProps('startsAt')} />
          <DateTimePicker label="Ends" valueFormat="D MMM YYYY HH:mm" {...form.getInputProps('endsAt')} />
          {(saving.error || remove.error) && <Alert color="red">{describeError(saving.error ?? remove.error)}</Alert>}
          <Group justify="space-between">
            {target.kind === 'edit' ? (
              <Button variant="subtle" color="red" loading={remove.isPending} onClick={() => confirmDelete(target.event)}>
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Group>
              <Button variant="default" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={saving.isPending}>
                {target.kind === 'new' ? 'Create' : 'Save'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
