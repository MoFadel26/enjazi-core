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
import {
  IconBolt,
  IconCalendar,
  IconCheck,
  IconChecklist,
  IconFlame,
  IconLayoutDashboard,
  IconMessages,
  IconSettings,
} from '@tabler/icons-react'

// App preview mockup showing the Enjazi interface inside window chrome.
export function LandingAppPreview() {
  return (
    <Container size="lg" pb="xl">
      <Card
        p={0}
        radius="lg"
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
      <Badge size="xs" variant="dot" color="teal">
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
        <ThemeIcon size="xs">
          <IconBolt size={14} stroke={1.75} />
        </ThemeIcon>
        <Text size="xs" fw={600}>
          Enjazi
        </Text>
      </Group>
      <MockNavItem label="Dashboard" icon={IconLayoutDashboard} active />
      <MockNavItem label="Tasks" icon={IconChecklist} />
      <MockNavItem label="Calendar" icon={IconCalendar} />
      <MockNavItem label="Rooms" icon={IconMessages} />
      <MockNavItem label="Settings" icon={IconSettings} />
    </Stack>
  )
}

function MockNavItem({ label, icon: Icon, active }: { label: string; icon: typeof IconLayoutDashboard; active?: boolean }) {
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
      <Icon size={14} stroke={1.75} />
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
        <MiniStat label="Streak" value="14 days" icon={IconFlame} color="lavender" />
        <MiniStat label="Tasks Completed" value="38 this week" icon={IconCheck} color="teal" />
        <MiniStat label="Focus Rooms" value="4 online" icon={IconMessages} color="lavender" />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        <Card p="sm" bg="var(--enjazi-surface-2)" bd="1px solid var(--mantine-color-default-border)">
          <Text size="xs" c="dimmed" fw={500} mb="xs">Today&apos;s Focus</Text>
          <Stack gap="xs">
            <MockTaskItem title="PostgreSQL EF Core migrations" done />
            <MockTaskItem title="Calendar week view scheduling" />
            <MockTaskItem title="SignalR live room messaging" />
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

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof IconFlame; color: string }) {
  return (
    <Card p="sm" bg="var(--enjazi-surface-2)" bd="1px solid var(--mantine-color-default-border)">
      <Group justify="space-between" mb="xs">
        <Text size="xs" c="dimmed" tt="uppercase" fw={500}>{label}</Text>
        <Icon size={16} stroke={1.75} color={`var(--mantine-color-${color}-6)`} />
      </Group>
      <Text size="lg" fw={600}>{value}</Text>
    </Card>
  )
}

function MockTaskItem({ title, done }: { title: string; done?: boolean }) {
  return (
    <Group justify="space-between" py={4} wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon size="xs" variant={done ? 'filled' : 'outline'} color={done ? 'lavender' : 'gray'}>
          {done && <IconCheck size={10} stroke={2} />}
        </ThemeIcon>
        <Text size="xs" td={done ? 'line-through' : undefined} c={done ? 'dimmed' : undefined}>{title}</Text>
      </Group>
      <Badge size="xs" variant="light" color={done ? 'gray' : 'lavender'}>{done ? 'Done' : 'In progress'}</Badge>
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
