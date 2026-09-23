import { Alert, Badge, Button, Card, Group, Loader, SimpleGrid, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { describeError } from '../api/errors'
import { RoomFormModal } from './RoomFormModal'
import { useJoinRoom, useRooms } from './queries'

// Every signed-in user sees every room, because joining one needs it to be
// visible. What is inside is behind membership. ADR-0007.
export function RoomsScreen() {
  const { data: rooms, isPending, error } = useRooms()
  const join = useJoinRoom()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <Group justify="space-between" mb="md">
        <Title order={2}>Rooms</Title>
        <Button onClick={() => setCreating(true)}>New room</Button>
      </Group>

      {isPending && <Loader />}
      {error && <Alert color="red">{describeError(error)}</Alert>}
      {rooms?.length === 0 && <Text c="dimmed">No rooms yet. Create the first one.</Text>}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {rooms?.map((room) => (
          <Card key={room.id} withBorder>
            <Group justify="space-between" mb="xs">
              <Text fw={600}>{room.name}</Text>
              <Badge variant="light">
                {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed" lineClamp={2} mb="md">
              {room.description ?? 'No description.'}
            </Text>
            {room.isMember ? (
              <Button component={Link} to={`/rooms/${room.id}`} variant="light">
                Open
              </Button>
            ) : (
              <Button
                variant="default"
                loading={join.isPending && join.variables?.params.path.id === room.id}
                onClick={() =>
                  join.mutate(
                    { params: { path: { id: room.id } } },
                    { onError: (err) => notifications.show({ color: 'red', message: describeError(err) }) },
                  )
                }
              >
                Join
              </Button>
            )}
          </Card>
        ))}
      </SimpleGrid>

      {creating && (
        <RoomFormModal room={null} onClose={() => setCreating(false)} onCreated={(room) => navigate(`/rooms/${room.id}`)} />
      )}
    </>
  )
}
