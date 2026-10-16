import { Center, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconBolt } from '@tabler/icons-react'
import type { ReactNode } from 'react'

// The centred column both anonymous screens render, with the wordmark above
// Clerk's card. The wordmark is written here rather than imported so the auth
// screens do not depend on the signed-in layout.
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Center mih="100vh" p="md">
      <Stack align="center" gap="lg">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size="sm">
            <IconBolt size={18} stroke={1.75} />
          </ThemeIcon>
          <Text fw={600} lts="-0.3px">
            Enjazi
          </Text>
        </Group>
        {children}
      </Stack>
    </Center>
  )
}
