import { Alert } from '@mantine/core'
import { describeError } from '../api/errors'
import { useCurrentUser, useDeleteAccount } from '../auth/session'
import { HoldButton } from '../ui/HoldButton'
import { Section } from './SettingsForm'

const accountText =
  'Deletes your tasks, events, settings and streak, and signs you out. Rooms you created pass to the member who ' +
  'joined first; a room with no one else in it is deleted. Your messages stay in rooms, from "Deleted user". ' +
  'This cannot be undone.'

const guestText = 'Deletes this guest session and everything in it now, including your messages. This cannot be undone.'

// The last card on Settings (ADR-0019). Outside the settings form: it saves
// nothing, and Save has no say over it.
export function DeleteAccount() {
  const { data: user } = useCurrentUser()
  const remove = useDeleteAccount()

  return (
    <Section title="Delete account" description={user?.isGuest ? guestText : accountText}>
      {remove.error && <Alert color="red">{describeError(remove.error)}</Alert>}
      <HoldButton
        color="red"
        variant="light"
        loading={remove.isPending}
        hint="Press and hold for 2 seconds to delete your account."
        onConfirm={() => remove.mutate({})}
      >
        Delete account
      </HoldButton>
    </Section>
  )
}
