import { Anchor, Card, Center, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconBolt } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = {
  title: string
  children: ReactNode
  footer: { text: string; linkText: string; to: string }
}

// The centred card both anonymous screens render inside, with the wordmark
// above it. The wordmark is written here rather than imported so the auth
// screens do not depend on the signed-in layout.
export function AuthCard({ title, children, footer }: Props) {
  return (
    <Center mih="100vh" p="md">
      <Stack align="center" gap="lg" w="100%" maw={400}>
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size="sm">
            <IconBolt size={18} stroke={1.75} />
          </ThemeIcon>
          <Text fw={600} lts="-0.3px">
            Enjazi
          </Text>
        </Group>
        <Card w="100%">
          <Stack>
            <Title order={1}>{title}</Title>
            {children}
            <Text size="sm" c="dimmed">
              {footer.text}{' '}
              <Anchor component={Link} to={footer.to} size="sm">
                {footer.linkText}
              </Anchor>
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Center>
  )
}
