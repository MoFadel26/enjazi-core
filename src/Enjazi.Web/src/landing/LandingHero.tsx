import { Button, Container, Group, Stack, Text, Title } from '@mantine/core'
import { ArrowRightIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'
import { useCurrentUser } from '../auth/session'
import { TryAsGuestButton } from '../auth/TryAsGuestButton'
import { display } from '../theme/display'
import { Icon } from '../ui/Icon'

// Hero section: product headline, value proposition and CTAs.
export function LandingHero() {
  const { data: user } = useCurrentUser()

  return (
    <Container size="lg" pt="xl" pb="md">
      <Stack align="center" gap="lg" py="xl">
        <Title order={1} ta="center" maw={760} {...display}>
          Tasks, calendar and streaks in one quiet workspace.
        </Title>

        <Text size="lg" c="dimmed" ta="center" maw={640}>
          Plan your day, finish what matters and keep your team in step.
        </Text>

        {user ? (
          <Button
            component={Link}
            to="/"
            size="md"
            mt="xs"
            rightSection={<Icon icon={ArrowRightIcon} />}
          >
            Launch App
          </Button>
        ) : (
          <Stack align="center" gap="sm" mt="xs">
            <Group gap="sm" justify="center">
              <Button
                component={Link}
                to="/register"
                size="md"
                rightSection={<Icon icon={ArrowRightIcon} />}
              >
                Get started free
              </Button>
              {/* No account needed: the visible way in for someone just looking. */}
              <TryAsGuestButton size="md" />
            </Group>
            <Text size="sm" c="dimmed" ta="center">
              No account needed to try. Guest data is kept for 7 days.
            </Text>
          </Stack>
        )}
      </Stack>
    </Container>
  )
}
