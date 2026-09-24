import { Anchor, Box, Divider, Group, Text, Title } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = {
  title: string
  description?: ReactNode
  // Right-aligned group of buttons and controls.
  actions?: ReactNode
  // A link rendered above the title, e.g. back to the list.
  back?: { to: string; label: string }
}

// Every screen starts with one of these; the desktop layout has no top bar.
export function PageHeader({ title, description, actions, back }: Props) {
  return (
    <Box mb="lg">
      {back && (
        <Anchor component={Link} to={back.to} size="sm" c="dimmed" mb="xs" display="inline-flex" style={{ alignItems: 'center', gap: 4 }}>
          <IconArrowLeft size={14} stroke={1.75} />
          {back.label}
        </Anchor>
      )}
      <Group justify="space-between" align="flex-start" gap="md">
        <div>
          <Title order={1}>{title}</Title>
          {description && (
            <Text c="dimmed" mt={4}>
              {description}
            </Text>
          )}
        </div>
        {actions && <Group gap="xs">{actions}</Group>}
      </Group>
      <Divider mt="md" />
    </Box>
  )
}
