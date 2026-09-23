import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { messagesInit, type Message } from './queries'

function messagesKey(roomId: string) {
  return ['get', '/api/rooms/{roomId}/messages', messagesInit(roomId)] as const
}

// Holds a hub connection open while a room is on screen and appends every
// pushed message for that room to the cached history, which is what the
// screen renders. The server decides who receives what (RoomHub); the client
// only filters by room, since one connection carries every room's messages.
export function useRoomFeed(roomId: string, enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/rooms')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('MessageReceived', (message: Message) => {
      if (message.roomId !== roomId) return
      queryClient.setQueryData<Message[]>(messagesKey(roomId), (current) =>
        // Before the history has loaded there is nothing to append to; the
        // history request will include this message. Ids dedupe the case
        // where the sender's own POST response and the push both land.
        current === undefined || current.some((m) => m.id === message.id) ? current : [...current, message],
      )
    })

    // Anything sent between the history request and the connection opening,
    // or during a dropped connection, is not pushed. Refetch to close the gap.
    const refetch = () => queryClient.invalidateQueries({ queryKey: messagesKey(roomId) })
    connection.onreconnected(refetch)
    connection.start().then(refetch, () => undefined)

    return () => {
      void connection.stop()
    }
  }, [roomId, enabled, queryClient])
}
