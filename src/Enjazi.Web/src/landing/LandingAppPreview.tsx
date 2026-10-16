import {
  Badge,
  Box,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core'
import { Icon } from '../ui/Icon'
import {
  CalendarBlankIcon,
  ChatsCircleIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleIcon,
  FireIcon,
  GearIcon,
  LightningIcon,
  ListChecksIcon,
  SquaresFourIcon,
  type Glyph,
} from '../ui/icons'

// App preview mockup showing the Enjazi interface inside window chrome.
export function LandingAppPreview() {
  return (
    <Container size="lg" mt="xl" pt="xl" pb="xl">
      <Card
        p={0}
        bd="1px solid var(--mantine-color-default-border)"
        bg="var(--enjazi-surface-1)"
      >
        <WindowChrome />
        <Box p="md">
          <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md">
            <Box visibleFrom="md">
              <MockSidebar />
            </Box>
            <Box style={{ gridColumn: 'span 3' }}>
              <MockDashboard />
            </Box>
          </SimpleGrid>
        </Box>
      </Card>
    </Container>
  )
}

function WindowChrome() {
  return (
    <Group
      justify="space-between"
      px="md"
      py="xs"
      bg="var(--enjazi-surface-2)"
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
    >
      <Group gap={6}>
        <WindowDot />
        <WindowDot />
        <WindowDot />
      </Group>
      <Text size="xs" c="dimmed" fw={500}>
        enjazi.app/dashboard
      </Text>
      <Badge size="xs" variant="dot" color="green">
        Realtime
      </Badge>
    </Group>
  )
}

function WindowDot() {
  return (
    <Box
      w={10}
      h={10}
      bg="var(--enjazi-surface-3)"
      style={{ borderRadius: '50%', border: '1px solid var(--mantine-color-default-border)' }}
    />
  )
}

function MockSidebar() {
  return (
    <Stack
      gap="xs"
      p="xs"
      h="100%"
      bg="var(--enjazi-surface-2)"
      style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-default-border)' }}
    >
      <Group gap="xs" px="xs" py="xs">
        <ThemeIcon size="sm">
          <Icon icon={LightningIcon} size="text" />
        </ThemeIcon>
        <Text size="xs" fw={600}>
          Enjazi
        </Text>
      </Group>
      <MockNavItem label="Dashboard" icon={SquaresFourIcon} active />
      <MockNavItem label="Tasks" icon={ListChecksIcon} />
      <MockNavItem label="Calendar" icon={CalendarBlankIcon} />
      <MockNavItem label="Rooms" icon={ChatsCircleIcon} />
      <MockNavItem label="Settings" icon={GearIcon} />
    </Stack>
  )
}

function MockNavItem({ label, icon, active }: { label: string; icon: Glyph; active?: boolean }) {
  return (
    <Group
      gap="xs"
      px="xs"
      py={6}
      bg={active ? 'var(--enjazi-surface-3)' : undefined}
      style={{
        borderRadius: 'var(--mantine-radius-sm)',
        border: active ? '1px solid var(--mantine-color-default-border)' : undefined,
      }}
    >
      <Icon icon={icon} size="text" active={active} />
      <Text size="xs" fw={active ? 500 : 400}>
        {label}
      </Text>
    </Group>
  )
}

function MockDashboard() {
  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <MiniStat label="Streak" value="14 days" icon={FireIcon} color="accent" />
        <MiniStat label="Tasks Completed" value="38 this week" icon={CheckIcon} color="green" />
        <MiniStat label="Focus Rooms" value="4 online" icon={ChatsCircleIcon} color="gray" />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <Card p="sm" bg="var(--enjazi-surface-2)" bd="1px solid var(--mantine-color-default-border)">
          <Text size="xs" c="dimmed" fw={500} mb="xs">Today&apos;s Focus</Text>
          <Stack gap="xs">
            <MockTaskItem title="Send the weekly report" done />
            <MockTaskItem title="Plan next week" />
            <MockTaskItem title="Review the design draft" />
          </Stack>
        </Card>

        <Card p="sm" bg="var(--enjazi-surface-2)" bd="1px solid var(--mantine-color-default-border)">
          <Text size="xs" c="dimmed" fw={500} mb="xs">Upcoming Schedule</Text>
          <Stack gap="xs">
            <MockEventItem time="10:00 AM" title="Engineering Sync" />
            <MockEventItem time="02:00 PM" title="Sprint Retrospective" />
            <MockEventItem time="04:30 PM" title="Design System Review" />
          </Stack>
        </Card>
      </SimpleGrid>
    </Stack>
  )
}

function MiniStat({ label, value, icon, color }: { label: string; value: string; icon: Glyph; color: string }) {
  return (
    <Card p="sm" bg="var(--enjazi-surface-2)" bd="1px solid var(--mantine-color-default-border)">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed" tt="uppercase" fw={500}>{label}</Text>
        <Box display="inline-flex" c={`var(--mantine-color-${color}-text)`}>
          <Icon icon={icon} size="text" />
        </Box>
      </Group>
      <Text size="lg" fw={600}>{value}</Text>
    </Card>
  )
}

function MockTaskItem({ title, done }: { title: string; done?: boolean }) {
  return (
    <Group justify="space-between" py={4} wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <Box display="inline-flex" c={done ? 'accent' : 'dimmed'}>
          <Icon icon={done ? CheckCircleIcon : CircleIcon} size="text" active={done} />
        </Box>
        <Text size="xs" td={done ? 'line-through' : undefined} c={done ? 'dimmed' : undefined}>{title}</Text>
      </Group>
      {/* Status pills take their meaning's colour, never the accent. */}
      <Badge size="xs" variant="light" color={done ? 'green' : 'yellow'} c={done ? 'green' : 'yellow'}>
        {done ? 'Done' : 'In progress'}
      </Badge>
    </Group>
  )
}

function MockEventItem({ time, title }: { time: string; title: string }) {
  return (
    <Group justify="space-between" py={4} wrap="nowrap">
      <Text size="xs">{title}</Text>
      <Text size="xs" c="dimmed">{time}</Text>
    </Group>
  )
}
