import { Button, Group, Paper, Text } from '@mantine/core'
import dayjs from 'dayjs'
import { Link } from 'react-router'

// Above every screen while signed in as a guest (ADR-0017). Not dismissible:
// the data really is deleted on that date.
export function GuestBanner({ expiresAt }: { expiresAt: string }) {
  return (
    <Paper p="sm" mb="lg" bg="var(--enjazi-accent-tint)">
      <Group justify="space-between" gap="sm">
        <Text size="sm">
          Guest session — your data is deleted on {dayjs(expiresAt).format('MMM D')}. Sign up to keep it.
        </Text>
        <Button component={Link} to="/register" size="xs">
          Sign up
        </Button>
      </Group>
    </Paper>
  )
}
