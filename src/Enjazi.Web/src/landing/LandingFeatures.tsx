import { Card, Container, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconCalendar, IconChecklist, IconFlame, IconMessages, type IconProps } from '@tabler/icons-react'

const iconProps: IconProps = { size: 20, stroke: 1.75 }

const features = [
  {
    icon: IconChecklist,
    title: 'Scoped Task Management',
    description:
      'Ownership is enforced at the database layer with EF Core global query filters. Zero cross-user data leakage by architectural design.',
  },
  {
    icon: IconFlame,
    title: 'Streak & Momentum Clock',
    description:
      'Build daily consistency with a dedicated streak clock. Increments when tasks complete in your timezone, resetting gracefully on missed days.',
  },
  {
    icon: IconCalendar,
    title: 'Fluid FullCalendar Scheduling',
    description:
      'Plan your days and weeks with drag-and-drop event scheduling, seamlessly bridging your calendar with actionable daily tasks.',
  },
  {
    icon: IconMessages,
    title: 'Real-Time Focus Rooms',
    description:
      'Collaborate and hold sprint rooms with teammates. Push-only SignalR notifications stream messages and presence instantly.',
  },
]

// Feature highlight cards demonstrating Enjazi's core capabilities.
export function LandingFeatures() {
  return (
    <Container size="lg" py="xl">
      <Stack align="center" gap="sm" mb="xl">
        <Title order={2} ta="center">
          Engineered for velocity and focus
        </Title>
        <Text size="md" c="dimmed" ta="center" maw={560}>
          Every feature in Enjazi was designed with clear separation of concerns,
          strict security, and a quiet, distraction-free aesthetic.
        </Text>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {features.map((feature) => (
          <Card
            key={feature.title}
            p="md"
            bg="var(--enjazi-surface-1)"
            bd="1px solid var(--mantine-color-default-border)"
          >
            <ThemeIcon size="md" mb="sm" variant="light" color="lavender">
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
