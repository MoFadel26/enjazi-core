import { Button, Group, Text } from '@mantine/core'
import { useNavigate } from 'react-router'
import { useCurrentUser, useLogout } from '../auth/session'

export function UserMenu() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <Group gap="sm">
      <Text size="sm">{user?.displayName}</Text>
      <Button
        variant="subtle"
        size="xs"
        loading={logout.isPending}
        onClick={() => logout.mutate(undefined, { onSuccess: () => navigate('/login', { replace: true }) })}
      >
        Log out
      </Button>
    </Group>
  )
}
