import { ActionIcon, Anchor, Button, Container, Group, Text, ThemeIcon, useMantineColorScheme } from '@mantine/core'
import { IconBolt, IconMoon, IconSun } from '@tabler/icons-react'
import { Link } from 'react-router'
import { useCurrentUser } from '../auth/session'

// Sticky landing page navigation bar with wordmark, theme switch and auth links.
export function LandingNavbar() {
  const { data: user } = useCurrentUser()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  return (
    <BoxNav>
      <Container size="lg" h="100%">
        <Group justify="space-between" align="center" h="100%" wrap="nowrap">
          <Anchor component={Link} to="/" underline="never" c="inherit">
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size="sm">
                <IconBolt size={18} stroke={1.75} />
              </ThemeIcon>
              <Text fw={600} lts="-0.3px">
                Enjazi
              </Text>
            </Group>
          </Anchor>

          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="default"
              size="md"
              aria-label="Toggle color scheme"
              onClick={() => toggleColorScheme()}
            >
              {colorScheme === 'dark' ? <IconSun size={16} stroke={1.75} /> : <IconMoon size={16} stroke={1.75} />}
            </ActionIcon>

            {user ? (
              <Button component={Link} to="/" size="xs">
                Launch App
              </Button>
            ) : (
              <>
                <Button component={Link} to="/login" variant="default" size="xs">
                  Sign in
                </Button>
                <Button component={Link} to="/register" size="xs">
                  Get started
                </Button>
              </>
            )}
          </Group>
        </Group>
      </Container>
    </BoxNav>
  )
}

function BoxNav({ children }: { children: React.ReactNode }) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 56,
        backgroundColor: 'var(--enjazi-surface-1)',
        borderBottom: '1px solid var(--mantine-color-default-border)',
      }}
    >
      {children}
    </header>
  )
}
