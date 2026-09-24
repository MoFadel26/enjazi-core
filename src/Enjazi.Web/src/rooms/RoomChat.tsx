import { Alert, Box, Button, Group, Paper, ScrollArea, Stack, Text, TextInput, VisuallyHidden } from '@mantine/core'
import { IconMessage } from '@tabler/icons-react'
import dayjs from 'dayjs'
import { useEffect, useRef, useState } from 'react'
import { describeError } from '../api/errors'
import { useCurrentUser } from '../auth/session'
import { EmptyState } from '../ui/EmptyState'
import { UserAvatar } from '../ui/UserAvatar'
import { useRoomFeed } from './hub'
import { useMessages, useSendMessage, type Message } from './queries'

// Messages from one author within five minutes read as one run and share a header.
function continues(previous: Message | undefined, message: Message) {
  return previous?.authorId === message.authorId && dayjs(message.createdAt).diff(previous.createdAt, 'minute') < 5
}

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
    <Paper p="lg">
      <ScrollArea h={360} viewportRef={viewport} type="auto">
        <Stack gap="xs">
          {messages?.length === 0 && <EmptyState icon={<IconMessage size={20} stroke={1.75} />} title="No messages yet." description="Say hello." />}
          {messages?.map((message, index) => {
            const continued = continues(messages[index - 1], message)
            return (
              <Group key={message.id} data-testid="message" gap="sm" align="flex-start" wrap="nowrap" mt={continued || index === 0 ? 0 : 'xs'}>
                {/* A continued message keeps the avatar column so bodies line up. */}
                {continued ? <Box w={24} flex="0 0 auto" /> : <UserAvatar name={message.authorName} size="sm" />}
                <Box flex={1} miw={0}>
                  {continued ? (
                    <VisuallyHidden>{message.authorName}</VisuallyHidden>
                  ) : (
                    <Group gap="xs" align="baseline">
                      <Text size="sm" fw={500} c={message.authorId === me?.id ? 'var(--mantine-color-lavender-text)' : undefined}>
                        {message.authorName}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {dayjs(message.createdAt).format('D MMM HH:mm')}
                      </Text>
                    </Group>
                  )}
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{message.body}</Text>
                </Box>
              </Group>
            )
          })}
        </Stack>
      </ScrollArea>
      {(error || send.error) && (
        <Alert color="red" mt="sm">
          {describeError(error ?? send.error)}
        </Alert>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Group mt="md" gap="xs" wrap="nowrap">
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
