import { AppShell, Burger, Group, NavLink, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavLink as RouterNavLink, Outlet } from 'react-router'
import { UserMenu } from './UserMenu'

// The frame every signed-in screen renders inside. Screens are added to the
// navbar as they are built; a link to a route that does not exist yet would
// be a broken link.
export function AppLayout() {
  const [opened, { toggle }] = useDisclosure()

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700}>Enjazi</Text>
          </Group>
          <UserMenu />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <NavLink component={RouterNavLink} to="/" end label="Dashboard" onClick={toggle} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
