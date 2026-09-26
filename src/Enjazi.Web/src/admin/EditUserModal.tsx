import { Alert, Button, Checkbox, Group, Modal, Stack, Switch, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { describeError } from '../api/errors'
import { useCurrentUser } from '../auth/session'
import { useLastDefined } from '../lib/useLastDefined'
import { knownRoles, useUpdateAdminUser, type AdminUser } from './queries'

// undefined: closed.
type Props = { user: AdminUser | undefined; onClose: () => void }

type FormProps = { user: AdminUser; onClose: () => void }

// Always mounted, so Mantine's transition plays on open and close; the form
// lives in the content Mantine unmounts once closed, so every opening starts
// fresh. TaskFormModal has the same shape.
export function EditUserModal({ user, onClose }: Props) {
  const current = useLastDefined(user)

  return (
    <Modal opened={user !== undefined} onClose={onClose} title={current?.displayName}>
      {current && <EditUserForm key={current.id} user={current} onClose={onClose} />}
    </Modal>
  )
}

function EditUserForm({ user, onClose }: FormProps) {
  const { data: me } = useCurrentUser()
  const update = useUpdateAdminUser()
  const self = me?.id === user.id
  const form = useForm({
    initialValues: { disabled: user.disabled, roles: [...user.roles] },
  })

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        update.mutate({ params: { path: { id: user.id } }, body: values }, { onSuccess: onClose }),
      )}
    >
      <Stack>
        <Text size="sm" c="dimmed">
          {user.email}
        </Text>
        {self && (
          <Alert color="yellow">An admin cannot change their own account; another admin has to.</Alert>
        )}
        <Switch
          label="Disabled"
          description="A disabled account cannot sign in."
          {...form.getInputProps('disabled', { type: 'checkbox' })}
        />
        <Checkbox.Group label="Roles" {...form.getInputProps('roles')}>
          <Group mt="xs">
            {knownRoles.map((role) => (
              <Checkbox key={role} value={role} label={role} />
            ))}
          </Group>
        </Checkbox.Group>
        {update.error && <Alert color="red">{describeError(update.error)}</Alert>}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={update.isPending} disabled={self}>
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
