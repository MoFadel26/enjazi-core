import { AppShell, Burger, Group, Text, ThemeIcon } from '@mantine/core'
import { IconBolt } from '@tabler/icons-react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useCurrentUser } from '../auth/session'
import { ColorSchemeSync } from '../settings/ColorSchemeSync'
import { CommandPalette } from './CommandPalette'
import { iconProps } from './destinations'
import { NavList } from './NavList'
import { SearchRow } from './SearchRow'
import { UserMenu } from './UserMenu'
import { useShortcuts } from './useShortcuts'

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
// header with a burger below the sm breakpoint. It also owns the keyboard
// layer: the shortcuts and the command palette.
export function AppLayout() {
  // The mobile navbar is open only at the location it was opened at, so any
  // navigation closes it: a link, a shortcut or a palette action. Opening the
  // palette is not a navigation, so the Search row stays in view behind it.
  const { key } = useLocation()
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const opened = openedAt === key
  const { data: user } = useCurrentUser()
  const isAdmin = user?.roles.includes('Admin') ?? false
  useShortcuts(isAdmin)

  return (
    <AppShell
      header={{ height: { base: 48, sm: 0 } }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={{ base: 'md', sm: 'lg' }}
    >
      <ColorSchemeSync />
      <CommandPalette isAdmin={isAdmin} />
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md" gap="sm" wrap="nowrap">
          <Burger
            opened={opened}
            onClick={() => setOpenedAt(opened ? null : key)}
            size="sm"
            aria-label="Toggle navigation"
          />
          <Wordmark />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs" bg="var(--enjazi-surface-2)">
        {/* Below sm the header already carries the wordmark. */}
        <AppShell.Section py="sm" visibleFrom="sm">
          <Wordmark />
        </AppShell.Section>
        <AppShell.Section mb="xs">
          <SearchRow />
        </AppShell.Section>
        <AppShell.Section grow>
          <NavList isAdmin={isAdmin} />
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
}
