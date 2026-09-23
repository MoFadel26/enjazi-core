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

export type Message = components['schemas']['MessageResponse']

// The init object is the third element of the query key, so the feed hook
// builds the same shape to find this query in the cache. See hub.ts.
export function messagesInit(roomId: string) {
  return { params: { path: { roomId } } }
}

export function useMessages(roomId: string, enabled: boolean) {
  return api.useQuery('get', '/api/rooms/{roomId}/messages', messagesInit(roomId), { enabled })
}

// No invalidation: the server pushes the sent message back over the hub to
// every member, the sender included, and the feed hook puts it in the cache.
export function useSendMessage() {
  return api.useMutation('post', '/api/rooms/{roomId}/messages')
}
