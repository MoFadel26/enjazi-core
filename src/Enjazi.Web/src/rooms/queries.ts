import { api } from '../api/client'
import { useInvalidate } from '../api/invalidate'
import type { components } from '../api/schema'

export type Room = components['schemas']['RoomResponse']
export type RoomMember = components['schemas']['RoomMemberResponse']
export type RoomBody = components['schemas']['CreateRoomRequest']

export function useRooms() {
  return api.useQuery('get', '/api/rooms')
}

export function useRoom(id: string) {
  return api.useQuery('get', '/api/rooms/{id}', { params: { path: { id } } })
}

// Members are behind membership: a non-member gets 404, so do not ask.
export function useRoomMembers(id: string, enabled: boolean) {
  return api.useQuery('get', '/api/rooms/{id}/members', { params: { path: { id } } }, { enabled })
}

export function useCreateRoom() {
  const invalidate = useInvalidate('/api/rooms')
  return api.useMutation('post', '/api/rooms', { onSuccess: invalidate })
}

export function useUpdateRoom() {
  const invalidate = useInvalidate('/api/rooms')
  return api.useMutation('put', '/api/rooms/{id}', { onSuccess: invalidate })
}

export function useDeleteRoom() {
  const invalidate = useInvalidate('/api/rooms')
  return api.useMutation('delete', '/api/rooms/{id}', { onSuccess: invalidate })
}

export function useJoinRoom() {
  const invalidate = useInvalidate('/api/rooms')
  return api.useMutation('post', '/api/rooms/{id}/members', { onSuccess: invalidate })
}

// Leaving and removing someone else are the same call; the API decides which
// it is from the caller's identity.
export function useRemoveMember() {
  const invalidate = useInvalidate('/api/rooms')
  return api.useMutation('delete', '/api/rooms/{id}/members/{userId}', { onSuccess: invalidate })
}
