import { Alert, Button, Group, Paper, ScrollArea, Stack, Text, TextInput } from '@mantine/core'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { describeError } from '../api/errors'
import { useCurrentUser } from '../auth/session'
import { useRoomFeed } from './hub'
import { useMessages, useSendMessage } from './queries'

export function RoomChat({ roomId }: { roomId: string }) {
  const { data: me } = useCurrentUser()
  const { data: messages, error } = useMessages(roomId, true)
  useRoomFeed(roomId, true)
  const send = useSendMessage()
  const [draft, setDraft] = useState('')
  const viewport = useRef<HTMLDivElement>(null)

  // Keep the newest message in view as they arrive.
  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight })
  }, [messages])

  function submit() {
    const body = draft.trim()
    if (!body) return
    send.mutate({ params: { path: { roomId } }, body: { body } }, { onSuccess: () => setDraft('') })
  }

  return (
    <Paper withBorder p="sm">
      <ScrollArea h={360} viewportRef={viewport} type="auto">
        <Stack gap="xs" p="xs">
          {messages?.length === 0 && <Text c="dimmed">No messages yet. Say hello.</Text>}
          {messages?.map((message) => (
            <div key={message.id} data-testid="message">
              <Group gap="xs">
                <Text size="sm" fw={600} c={message.authorId === me?.id ? 'blue' : undefined}>
                  {message.authorName}
                </Text>
                <Text size="xs" c="dimmed">
                  {dayjs(message.createdAt).format('D MMM HH:mm')}
                </Text>
              </Group>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{message.body}</Text>
            </div>
          ))}
        </Stack>
      </ScrollArea>
      {(error || send.error) && <Alert color="red">{describeError(error ?? send.error)}</Alert>}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Group mt="sm" align="flex-end" wrap="nowrap">
          <TextInput
            aria-label="Message"
            placeholder="Write a message"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            maxLength={4000}
            style={{ flex: 1 }}
          />
          <Button type="submit" loading={send.isPending} disabled={draft.trim().length === 0}>
            Send
          </Button>
        </Group>
      </form>
    </Paper>
  )
}
