import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { Link } from 'react-router'
import { useCurrentUser } from '../auth/session'
import { LandingAppPreview } from './LandingAppPreview'
import { LandingFeatures } from './LandingFeatures'
import { LandingFooter } from './LandingFooter'
import { LandingHero } from './LandingHero'
import { LandingNavbar } from './LandingNavbar'

// The public landing page presenting Enjazi's value proposition and preview.
export function LandingScreen() {
  const { data: user } = useCurrentUser()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <LandingNavbar />
      <main style={{ flex: 1 }}>
        <LandingHero />
        <LandingAppPreview />
        <LandingFeatures />
        <Container size="lg" py="xl">
          <Card
            p={{ base: 'lg', sm: 'xl' }}
            radius="lg"
            bg="var(--enjazi-surface-1)"
            bd="1px solid var(--mantine-color-default-border)"
          >
            <Stack align="center" gap="md" ta="center" py="md">
              <Title order={2}>Ready to focus on what matters?</Title>
              <Text size="md" c="dimmed" maw={520}>
                Join Enjazi today and experience a calm, high-speed productivity
                platform built for high-performance individuals and teams.
              </Text>
              <Group gap="sm" mt="xs">
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
            </Stack>
          </Card>
        </Container>
      </main>
      <LandingFooter />
    </div>
  )
}
