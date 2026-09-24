import { Badge, Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowRight, IconBolt, IconCheck } from '@tabler/icons-react'
import { Link } from 'react-router'
import { useCurrentUser } from '../auth/session'

// Hero section: eyebrow badge, product headline, value proposition and CTAs.
export function LandingHero() {
  const { data: user } = useCurrentUser()

  return (
    <Container size="lg" pt="xl" pb="md">
      <Stack align="center" gap="lg" py="xl">
        <Badge
          variant="light"
          color="lavender"
          size="lg"
          leftSection={<IconBolt size={14} stroke={2} />}
        >
          Unified Productivity &amp; Real-Time Flow
        </Badge>

        <Title order={1} ta="center" maw={760}>
          Tasks, calendar, streaks, and collaborative rooms — unified.
        </Title>

        <Text size="lg" c="dimmed" ta="center" maw={640}>
          Enjazi brings high-velocity personal execution and collaborative team
          focus into one quiet workspace. Built with ASP.NET Core 10, React 19,
          and Mantine 9.
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
              <Button component={Link} to="/login" variant="default" size="md">
                Sign in
              </Button>
            </>
          )}
        </Group>

        <Group gap="lg" justify="center" mt="xs" wrap="wrap">
          <GuaranteeItem label="No credit card required" />
          <GuaranteeItem label="Instant setup" />
          <GuaranteeItem label="Data-layer tenant isolation" />
        </Group>
      </Stack>
    </Container>
  )
}

function GuaranteeItem({ label }: { label: string }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <IconCheck size={14} stroke={2} color="var(--mantine-color-lavender-6)" />
      <Text size="xs" c="dimmed">
        {label}
      </Text>
    </Group>
  )
}
