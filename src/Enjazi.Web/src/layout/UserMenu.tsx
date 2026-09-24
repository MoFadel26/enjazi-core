import { ActionIcon, Group, Stack, Text } from '@mantine/core'
import { IconLogout } from '@tabler/icons-react'
import { useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '../auth/session'
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
          {user?.email}
        </Text>
      </Stack>
      <ActionIcon
        aria-label="Log out"
        loading={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })}
      >
        <IconLogout size={18} stroke={1.75} />
      </ActionIcon>
    </Group>
  )
}
