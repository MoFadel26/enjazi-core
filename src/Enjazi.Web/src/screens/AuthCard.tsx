import { Center, Divider, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import type { ReactNode } from 'react'
import { TryAsGuestButton } from '../auth/TryAsGuestButton'
import { Icon } from '../ui/Icon'
import { LightningIcon } from '../ui/icons'

// The centred column both anonymous screens render, with the wordmark above
// Clerk's card, and below it the way in without an account (ADR-0017). The
// wordmark is written here rather than imported so the auth screens do not
// depend on the signed-in layout.
export function AuthCard({ children }: { children: ReactNode }) {
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
        {children}
        <Divider label="or skip the account" labelPosition="center" w="100%" />
        <TryAsGuestButton size="md" fullWidth />
      </Stack>
    </Center>
  )
}
