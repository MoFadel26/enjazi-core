import { Card, Container, SimpleGrid, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCalendar, IconChecklist, IconFlame, IconMessages, type IconProps } from '@tabler/icons-react'

const iconProps: IconProps = { size: 20, stroke: 1.75 }

const features = [
  {
    icon: IconChecklist,
    title: 'Your tasks stay private',
    description: 'Only you can see your tasks. Nobody else on Enjazi can open, list or change them.',
  },
  {
    icon: IconFlame,
    title: 'Build a daily streak',
    description: 'Finish one task a day and your streak grows. Days count in your own time zone.',
  },
  {
    icon: IconCalendar,
    title: 'Plan your week',
    description: 'Drag events into place on a week view and see what the next days hold.',
  },
  {
    icon: IconMessages,
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

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {features.map((feature) => (
          <Card
            key={feature.title}
            p="md"
            bg="var(--enjazi-surface-1)"
            bd="1px solid var(--mantine-color-default-border)"
          >
            <ThemeIcon size="md" mb="sm" variant="light" color="accent">
              <feature.icon {...iconProps} />
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
