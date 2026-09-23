import { AppShell, Burger, Group, NavLink, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { NavLink as RouterNavLink, Outlet } from 'react-router'
import { useCurrentUser } from '../auth/session'
import { ColorSchemeSync } from '../settings/ColorSchemeSync'
import { UserMenu } from './UserMenu'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/settings', label: 'Settings' },
]

// The frame every signed-in screen renders inside.
export function AppLayout() {
  const [opened, { toggle }] = useDisclosure()
  const { data: user } = useCurrentUser()
  const isAdmin = user?.roles.includes('Admin') ?? false

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <ColorSchemeSync />
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
        {links.map((link) => (
          <NavLink key={link.to} component={RouterNavLink} to={link.to} end={link.to === '/'} label={link.label} onClick={close} />
        ))}
        {isAdmin && <NavLink component={RouterNavLink} to="/admin/users" label="Users" onClick={close} />}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )

  // Closes the mobile navbar after a link is followed; a no-op on desktop.
  function close() {
    if (opened) toggle()
  }
}
