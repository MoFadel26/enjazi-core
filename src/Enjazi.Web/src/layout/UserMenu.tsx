import { ActionIcon, Group, Stack, Text } from '@mantine/core'
import { SignOutIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '../auth/session'
import { Icon } from '../ui/Icon'
import { UserAvatar } from '../ui/UserAvatar'

// The user row pinned to the bottom of the sidebar.
export function UserMenu() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()
  const name = user?.displayName ?? ''

  return (
    <Group gap="sm" wrap="nowrap" p="xs">
      <UserAvatar name={name} />
      <Stack gap={0} flex={1} miw={0}>
        <Text size="sm" fw={500} truncate>
          {name}
        </Text>
        <Text size="xs" c="dimmed" truncate>
          {user?.isGuest ? 'Guest session' : user?.email}
        </Text>
      </Stack>
      <ActionIcon
        aria-label="Log out"
        loading={logout.isPending}
        // A guest who leaves is sent to the landing page by RequireAuth.
        onClick={() => logout.mutate(undefined, { onSuccess: () => user?.isGuest || navigate('/login', { replace: true }) })}
      >
        <Icon icon={SignOutIcon} />
      </ActionIcon>
    </Group>
  )
}
