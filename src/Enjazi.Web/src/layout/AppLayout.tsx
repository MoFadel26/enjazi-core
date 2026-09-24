import { AppShell, Burger, Group, NavLink, Text, ThemeIcon } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconBolt,
  IconCalendar,
  IconChecklist,
  IconLayoutDashboard,
  IconMessages,
  IconSettings,
  IconUsers,
  type IconProps,
} from '@tabler/icons-react'
import { NavLink as RouterNavLink, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '../auth/session'
import { ColorSchemeSync } from '../settings/ColorSchemeSync'
import { Eyebrow } from '../ui/Eyebrow'
import { UserMenu } from './UserMenu'

const iconProps: IconProps = { size: 18, stroke: 1.75 }

const links = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: IconChecklist },
  { to: '/calendar', label: 'Calendar', icon: IconCalendar },
  { to: '/rooms', label: 'Rooms', icon: IconMessages },
  { to: '/settings', label: 'Settings', icon: IconSettings },
]

const adminLinks = [{ to: '/admin/users', label: 'Users', icon: IconUsers }]

function Wordmark() {
  return (
    <Group gap="xs" px="xs" wrap="nowrap">
      <ThemeIcon size="sm">
        <IconBolt {...iconProps} />
      </ThemeIcon>
      <Text fw={600} lts="-0.3px">
        Enjazi
      </Text>
    </Group>
  )
}

// The frame every signed-in screen renders inside: a sidebar on desktop, a
// header with a burger below the sm breakpoint.
export function AppLayout() {
  const [opened, { toggle }] = useDisclosure()
  const { data: user } = useCurrentUser()
  const { pathname } = useLocation()
  const isAdmin = user?.roles.includes('Admin') ?? false

  // Mirrors react-router's own matching so Mantine's active styles and
  // aria-current agree.
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  const renderLink = ({ to, label, icon: Icon }: (typeof links)[number]) => (
    <NavLink
      key={to}
      component={RouterNavLink}
      to={to}
      end={to === '/'}
      label={label}
      leftSection={<Icon {...iconProps} />}
      active={isActive(to)}
      onClick={close}
    />
  )

  return (
    <AppShell
      header={{ height: { base: 48, sm: 0 } }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={{ base: 'md', sm: 'lg' }}
    >
      <ColorSchemeSync />
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md" gap="sm" wrap="nowrap">
          <Burger opened={opened} onClick={toggle} size="sm" aria-label="Toggle navigation" />
          <Wordmark />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs" bg="var(--enjazi-surface-2)">
        {/* Below sm the header already carries the wordmark. */}
        <AppShell.Section py="sm" visibleFrom="sm">
          <Wordmark />
        </AppShell.Section>
        <AppShell.Section grow>
          {links.map(renderLink)}
          {isAdmin && (
            <>
              <Eyebrow px="sm" mt="lg" mb="xs">
                Admin
              </Eyebrow>
              {adminLinks.map(renderLink)}
            </>
          )}
        </AppShell.Section>
        <AppShell.Section>
          <UserMenu />
        </AppShell.Section>
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
