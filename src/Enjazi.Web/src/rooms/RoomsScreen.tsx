import { Alert, Badge, Button, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ChatsCircleIcon, PlusIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { describeError } from '../api/errors'
import { useCurrentUser } from '../auth/session'
import { EmptyState } from '../ui/EmptyState'
import { Icon } from '../ui/Icon'
import { PageHeader } from '../ui/PageHeader'
import { UserAvatar } from '../ui/UserAvatar'
import { RoomFormModal } from './RoomFormModal'
import { RoomsSkeleton } from './RoomsSkeleton'
import { useJoinRoom, useRooms } from './queries'

// Every signed-in user sees every room, because joining one needs it to be
// visible. What is inside is behind membership. ADR-0007.
export function RoomsScreen() {
  const { data: rooms, isPending, error } = useRooms()
  const join = useJoinRoom()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  // Guests join and chat but cannot create rooms (ADR-0017).
  const { data: user } = useCurrentUser()
  const canCreate = user?.isGuest !== true

  return (
    <>
      <PageHeader
        title="Rooms"
        actions={
          canCreate && (
            <Button leftSection={<Icon icon={PlusIcon} />} onClick={() => setCreating(true)}>
              New room
            </Button>
          )
        }
      />

      {isPending && <RoomsSkeleton />}
      {error && <Alert color="red">{describeError(error)}</Alert>}
      {rooms?.length === 0 && (
        <EmptyState
          icon={<Icon icon={ChatsCircleIcon} />}
          title="No rooms yet."
          description={canCreate ? 'Create the first one.' : 'Sign up to start one.'}
          // Named apart from "New room": tests match names as substrings. docs/design.md, "Test contract".
          action={
            canCreate && (
              <Button variant="default" onClick={() => setCreating(true)}>
                Start a room
              </Button>
            )
          }
        />
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {rooms?.map((room) => (
          <Card key={room.id}>
            <Stack gap="sm">
              <Group justify="space-between" wrap="nowrap">
                <Group gap="xs" wrap="nowrap" miw={0}>
                  <UserAvatar name={room.name} />
                  <Text fw={500} truncate>
                    {room.name}
                  </Text>
                </Group>
                <Badge variant="default" style={{ flexShrink: 0 }}>
                  {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed" lineClamp={2}>
                {room.description ?? 'No description.'}
              </Text>
              <Group>
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
              </Group>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      <RoomFormModal
        room={creating ? null : undefined}
        onClose={() => setCreating(false)}
        onCreated={(room) => navigate(`/rooms/${room.id}`)}
      />
    </>
  )
}
