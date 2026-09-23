import { Anchor, Center, Paper, Stack, Text, Title } from '@mantine/core'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = {
  title: string
  children: ReactNode
  footer: { text: string; linkText: string; to: string }
}

// The centred card both anonymous screens render inside.
export function AuthCard({ title, children, footer }: Props) {
  return (
    <Center mih="100vh" p="md">
      <Paper withBorder shadow="sm" p="lg" w={380}>
        <Stack>
          <Title order={2}>{title}</Title>
          {children}
          <Text size="sm">
            {footer.text}{' '}
            <Anchor component={Link} to={footer.to}>
              {footer.linkText}
            </Anchor>
          </Text>
        </Stack>
      </Paper>
    </Center>
  )
}
