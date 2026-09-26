import { Box, Flex, Paper, Title } from '@mantine/core'
import type { ReactNode } from 'react'

type Props = {
  chat: ReactNode
  members: ReactNode
}

// Chat on the left, growing; Members in a 320px panel on the right; stacked
// below md. Shared by the room and its skeleton so both lay out the same.
export function RoomBody({ chat, members }: Props) {
  return (
    <Flex direction={{ base: 'column', md: 'row' }} gap="lg" align="flex-start">
      <Box w="100%" flex={1} miw={0}>
        {chat}
      </Box>
      <Paper p="lg" w={{ base: '100%', md: 320 }} style={{ flexShrink: 0 }}>
        <Title order={3} mb="sm">
          Members
        </Title>
        {members}
      </Paper>
    </Flex>
  )
}
