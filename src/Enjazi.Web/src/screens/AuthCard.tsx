import { Center, Divider, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import type { ReactNode } from 'react'
import { useGuestSession } from '../api/guestSession'
import { TryAsGuestButton } from '../auth/TryAsGuestButton'
import { Icon } from '../ui/Icon'
import { LightningIcon } from '../ui/icons'

type Props = {
  children: ReactNode
  // Register leads with the way in without an account; sign-in keeps it
  // below Clerk's card.
  guestFirst?: boolean
}

// The centred column both anonymous screens render, with the wordmark above
// Clerk's card, and the way in without an account (ADR-0017) above or below
// it. The wordmark is written here rather than imported so the auth screens
// do not depend on the signed-in layout. A visitor already in a guest
// session sees neither the guest button nor its divider: they came to sign
// up and keep their data.
export function AuthCard({ children, guestFirst = false }: Props) {
  const guest = useGuestSession()

  return (
    <Center mih="100vh" p="md">
      <Stack align="center" gap="lg">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size="sm">
            <Icon icon={LightningIcon} size="text" />
          </ThemeIcon>
          <Text fw={600} lts="-0.3px">
            Enjazi
          </Text>
        </Group>
        {guestFirst && !guest && (
          <>
            <Stack gap="xs" w="100%" align="center">
              <TryAsGuestButton size="md" fullWidth />
              <Text size="sm" c="dimmed">
                Guest data is kept for 7 days.
              </Text>
            </Stack>
            <Divider label="or create an account" labelPosition="center" w="100%" />
          </>
        )}
        {children}
        {!guestFirst && !guest && (
          <>
            <Divider label="or skip the account" labelPosition="center" w="100%" />
            <TryAsGuestButton size="md" fullWidth />
          </>
        )}
      </Stack>
    </Center>
  )
}
