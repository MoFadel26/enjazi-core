import { Alert, Box, Button, Flex, Loader, Paper, Text, Title } from '@mantine/core'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { describeError } from '../api/errors'
import { useCurrentUser } from '../auth/session'
import { PageHeader } from '../ui/PageHeader'
import { MemberList } from './MemberList'
import { RoomChat } from './RoomChat'
import { RoomFormModal } from './RoomFormModal'
import { useDeleteRoom, useJoinRoom, useRemoveMember, useRoom, useRoomMembers, type RoomMember } from './queries'

export function RoomScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: me } = useCurrentUser()
  const { data: room, isPending, error } = useRoom(id)
  const { data: members } = useRoomMembers(id, room?.isMember === true)
  const join = useJoinRoom()
  const remove = useRemoveMember()
  const deleteRoom = useDeleteRoom()
  const [editing, setEditing] = useState(false)

  const fail = (err: unknown) => notifications.show({ color: 'red', message: describeError(err) })

  if (isPending) return <Loader />
  if (error || !room) return <Alert color="red">{describeError(error)}</Alert>

  // Administration follows the membership row, not the owner column, so a
  // later transfer of it would show up here without any change. ADR-0007.
  const isAdmin = members?.some((m) => m.userId === me?.id && m.role === 'Admin') ?? false
  const isOwner = room.ownerId === me?.id

  function removeMember(member: RoomMember) {
    const leaving = member.userId === me?.id
    modals.openConfirmModal({
      title: leaving ? 'Leave room' : 'Remove member',
      children: leaving ? `Leave "${room?.name}"?` : `Remove ${member.displayName} from the room?`,
      labels: { confirm: leaving ? 'Leave' : 'Remove', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () =>
        remove.mutate(
          { params: { path: { id, userId: member.userId } } },
          { onSuccess: () => leaving && navigate('/rooms'), onError: fail },
        ),
    })
  }

  function confirmDelete() {
    modals.openConfirmModal({
      title: 'Delete room',
      children: `Delete "${room?.name}" and its membership? This cannot be undone.`,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteRoom.mutate({ params: { path: { id } } }, { onSuccess: () => navigate('/rooms'), onError: fail }),
    })
  }

  return (
    <>
      <PageHeader
        back={{ to: '/rooms', label: 'All rooms' }}
        title={room.name}
        description={room.description ?? 'No description.'}
        actions={
          <>
            {!room.isMember && (
              <Button loading={join.isPending} onClick={() => join.mutate({ params: { path: { id } } }, { onError: fail })}>
                Join
              </Button>
            )}
            {room.isMember && !isOwner && me && (
              <Button variant="default" onClick={() => removeMember({ userId: me.id, displayName: me.displayName, role: 'Member', joinedAt: '' })}>
                Leave
              </Button>
            )}
            {isAdmin && (
              <Button variant="default" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )}
            {isAdmin && (
              <Button color="red" variant="light" onClick={confirmDelete}>
                Delete
              </Button>
            )}
          </>
        }
      />

      {room.isMember ? (
        <Flex direction={{ base: 'column', md: 'row' }} gap="lg" align="flex-start">
          <Box w="100%" flex={1} miw={0}>
            <RoomChat roomId={id} />
          </Box>
          <Paper p="lg" w={{ base: '100%', md: 320 }} style={{ flexShrink: 0 }}>
            <Title order={3} mb="sm">
              Members
            </Title>
            {members ? (
              <MemberList
                members={members}
                // The creator cannot be removed (the API refuses); admins remove others; nobody removes themselves here, that is Leave.
                canRemove={(m) => isAdmin && m.userId !== me?.id && m.userId !== room.ownerId}
                onRemove={removeMember}
              />
            ) : (
              <Loader />
            )}
          </Paper>
        </Flex>
      ) : (
        <Text c="dimmed">Join the room to read and send messages.</Text>
      )}

      {editing && <RoomFormModal room={room} onClose={() => setEditing(false)} />}
    </>
  )
}
