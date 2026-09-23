import { Alert, Button, Checkbox, Group, Modal, Stack, Switch, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { describeError } from '../api/errors'
import { useCurrentUser } from '../auth/session'
import { knownRoles, useUpdateAdminUser, type AdminUser } from './queries'

type Props = { user: AdminUser; onClose: () => void }

export function EditUserModal({ user, onClose }: Props) {
  const { data: me } = useCurrentUser()
  const update = useUpdateAdminUser()
  const self = me?.id === user.id
  const form = useForm({
    initialValues: { disabled: user.disabled, roles: [...user.roles] },
  })

  return (
    <Modal opened onClose={onClose} title={user.displayName}>
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
    </Modal>
  )
}
