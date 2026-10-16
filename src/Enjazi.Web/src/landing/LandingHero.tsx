import { Badge, Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowRight, IconBolt, IconCheck } from '@tabler/icons-react'
import { Link } from 'react-router'
import { useCurrentUser } from '../auth/session'
import { TryAsGuestButton } from '../auth/TryAsGuestButton'

// Hero section: eyebrow badge, product headline, value proposition and CTAs.
export function LandingHero() {
  const { data: user } = useCurrentUser()

  return (
    <Container size="lg" pt="xl" pb="md">
      <Stack align="center" gap="lg" py="xl">
        <Badge
          variant="light"
          color="accent"
          size="lg"
          leftSection={<IconBolt size={14} stroke={2} />}
        >
          Unified Productivity &amp; Real-Time Flow
        </Badge>

        <Title order={1} ta="center" maw={760}>
          Tasks, calendar, streaks, and collaborative rooms — unified.
        </Title>

        <Text size="lg" c="dimmed" ta="center" maw={640}>
          Plan your day, finish what matters and keep your team in step, all in
          one quiet workspace.
        </Text>

        <Group gap="sm" justify="center" mt="xs">
          {user ? (
            <Button
              component={Link}
              to="/"
              size="md"
              rightSection={<IconArrowRight size={16} stroke={1.75} />}
            >
              Launch App
            </Button>
          ) : (
            <>
              <Button
                component={Link}
                to="/register"
                size="md"
                rightSection={<IconArrowRight size={16} stroke={1.75} />}
              >
                Get started for free
              </Button>
              {/* No account needed: the visible way in for someone just looking. */}
              <TryAsGuestButton size="md" />
              <Button component={Link} to="/login" variant="subtle" color="gray" size="md">
                Sign in
              </Button>
            </>
          )}
        </Group>

        <Group gap="lg" justify="center" mt="xs" wrap="wrap">
          <GuaranteeItem label="Your tasks stay private" />
          <GuaranteeItem label="Work alongside your team in real time" />
          <GuaranteeItem label="Build a daily streak" />
        </Group>
      </Stack>
    </Container>
  )
}

function GuaranteeItem({ label }: { label: string }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <IconCheck size={14} stroke={2} color="var(--mantine-color-accent-text)" />
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Group>
  )
}
