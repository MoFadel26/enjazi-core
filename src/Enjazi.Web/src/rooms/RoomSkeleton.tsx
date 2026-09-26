import { Anchor, Box, Divider, Group, Paper, Skeleton } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { Link } from 'react-router'
import { MemberListSkeleton } from './MemberList'
import { RoomBody } from './RoomBody'
import { chatHeight } from './RoomChat'

// The room before it arrives. The back link is PageHeader's own, so it works
// while the room loads. It sits outside the progressbar because ARIA makes a
// progressbar's children presentational, and the link is not a placeholder.
// Bars stand where PageHeader puts the h1 and the description, each as tall
// as its line; the chat frame keeps RoomChat's message area and composer
// heights.
export function RoomSkeleton() {
  return (
    <>
      <Anchor component={Link} to="/rooms" size="sm" c="dimmed" mb="xs" display="inline-flex" style={{ alignItems: 'center', gap: 4 }}>
        <IconArrowLeft size={14} stroke={1.75} />
        All rooms
      </Anchor>
      <Box role="progressbar" aria-label="Loading room">
        <Box mb="lg">
          <Skeleton height={29} width="40%" />
          <Skeleton height={21} width="60%" mt={4} />
          <Divider mt="md" />
        </Box>
        <RoomBody
          chat={
            <Paper p="lg">
              <Box h={chatHeight} />
              <Group mt="md" gap="xs" wrap="nowrap">
                <Skeleton height={36} flex={1} />
                <Skeleton height={36} width={64} />
              </Group>
            </Paper>
          }
          members={<MemberListSkeleton />}
        />
      </Box>
    </>
  )
}
