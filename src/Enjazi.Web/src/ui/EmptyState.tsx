import { Center, Stack, Text } from '@mantine/core'
import type { ReactNode } from 'react'

type Props = {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <Stack align="center" gap="xs" p="xl">
      <Center w={36} h={36} bdrs="50%" bg="var(--enjazi-surface-3)" c="dimmed">
        {icon}
      </Center>
      <Text fw={500}>{title}</Text>
      {description && (
        <Text size="sm" c="dimmed" ta="center">
          {description}
        </Text>
      )}
      {action}
    </Stack>
  )
}
