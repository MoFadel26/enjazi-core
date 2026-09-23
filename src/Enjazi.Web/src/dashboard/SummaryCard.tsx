import { Anchor, Card, Group, Stack, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = {
  title: string
  to: string
  linkText: string
  children: ReactNode
}

export function SummaryCard({ title, to, linkText, children }: Props) {
  return (
    <Card withBorder h="100%">
      <Stack justify="space-between" h="100%">
        <div>
          <Title order={4} mb="sm">
            {title}
          </Title>
          {children}
        </div>
        <Group justify="flex-end">
          <Anchor component={Link} to={to} size="sm">
            {linkText}
          </Anchor>
        </Group>
      </Stack>
    </Card>
  )
}
