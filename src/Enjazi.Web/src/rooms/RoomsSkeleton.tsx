import { Card, Group, SimpleGrid, Skeleton, Stack } from '@mantine/core'

// Three cards in RoomsScreen's grid, shaped like a room card: the avatar,
// name and member badge, one line of description, then the Open or Join
// button. Bars are as tall as the lines they stand for.
export function RoomsSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} role="progressbar" aria-label="Loading rooms">
      {[0, 1, 2].map((card) => (
        <Card key={card}>
          <Stack gap="sm">
            <Group gap="xs" wrap="nowrap">
              <Skeleton circle height={32} />
              <Skeleton height={21} width="35%" />
              <Skeleton height={18} width={64} ml="auto" />
            </Group>
            <Skeleton height={18} width="80%" />
            <Skeleton height={36} width={64} />
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  )
}
