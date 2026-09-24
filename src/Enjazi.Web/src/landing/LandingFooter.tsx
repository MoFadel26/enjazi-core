import { Anchor, Container, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconBolt } from '@tabler/icons-react'
import { Link } from 'react-router'

// Minimalist landing page footer.
export function LandingFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--mantine-color-default-border)',
        backgroundColor: 'var(--enjazi-surface-1)',
      }}
    >
      <Container size="lg" py="xl">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="xs">
            <ThemeIcon size="sm">
              <IconBolt size={18} stroke={1.75} />
            </ThemeIcon>
            <Stack gap={2}>
              <Text fw={600} lts="-0.3px">
                Enjazi
              </Text>
              <Text size="xs" c="dimmed">
                Personal execution, streaks, and collaborative rooms.
              </Text>
            </Stack>
          </Group>

          <Group gap="lg">
            <Anchor component={Link} to="/login" size="xs" c="dimmed">
              Sign in
            </Anchor>
            <Anchor component={Link} to="/register" size="xs" c="dimmed">
              Register
            </Anchor>
            <Text size="xs" c="dimmed">
              &copy; {new Date().getFullYear()} Enjazi
            </Text>
          </Group>
        </Group>
      </Container>
    </footer>
  )
}
