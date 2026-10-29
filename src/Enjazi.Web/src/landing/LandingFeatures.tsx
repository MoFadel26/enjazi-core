import { Card, Container, SimpleGrid, Text, ThemeIcon, Title } from '@mantine/core'
import { Icon } from '../ui/Icon'
import { CalendarBlankIcon, ChatsCircleIcon, FireIcon } from '../ui/icons'

const features = [
  {
    icon: FireIcon,
    title: 'Build a daily streak',
    description: 'Finish one task a day and your streak grows. Days count in your own time zone.',
  },
  {
    icon: CalendarBlankIcon,
    title: 'Plan your week',
    description: 'Drag events into place on a week view and see what the next days hold.',
  },
  {
    icon: ChatsCircleIcon,
    title: 'Work alongside your team in real time',
    description: 'Open a room with your team. Messages arrive the moment they are sent.',
  },
]

// Feature highlight cards demonstrating Enjazi's core capabilities.
export function LandingFeatures() {
  return (
    <Container size="lg" py="xl">
      <Title order={2} ta="center" mb="xl">
        What you get
      </Title>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
        {features.map((feature) => (
          <Card
            key={feature.title}
            p="md"
            bg="var(--enjazi-surface-1)"
            bd="1px solid var(--mantine-color-default-border)"
          >
            <ThemeIcon size="lg" mb="sm" variant="light" color="accent">
              <Icon icon={feature.icon} size="feature" />
            </ThemeIcon>
            <Text size="sm" fw={600} mb="xs">
              {feature.title}
            </Text>
            <Text size="xs" c="dimmed">
              {feature.description}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  )
}
