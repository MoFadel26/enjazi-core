import { ActionIcon, Badge, Box, Group, Table, Text } from '@mantine/core'
import { IconUserMinus } from '@tabler/icons-react'
import { formatDate } from '../lib/dates'
import { UserAvatar } from '../ui/UserAvatar'
import type { RoomMember } from './queries'

type Props = {
  members: RoomMember[]
  // Which rows get a Remove button and what happens when it is pressed.
  canRemove: (member: RoomMember) => boolean
  onRemove: (member: RoomMember) => void
}

export function MemberList({ members, canRemove, onRemove }: Props) {
  return (
    <Table>
      <Table.Tbody>
        {members.map((member) => (
          <Table.Tr key={member.userId}>
            <Table.Td>
              <Group gap="xs" wrap="nowrap">
                <UserAvatar name={member.displayName} size="sm" />
                {/* The date sits under the name so the row fits the 320px members panel. */}
                <Box miw={0}>
                  <Text fw={500} truncate>
                    {member.displayName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Joined {formatDate(member.joinedAt)}
                  </Text>
                </Box>
              </Group>
            </Table.Td>
            <Table.Td>
              <Badge color={member.role === 'Admin' ? 'lavender' : 'gray'}>{member.role}</Badge>
            </Table.Td>
            <Table.Td align="right" w={36}>
              {canRemove(member) && (
                <ActionIcon color="red" aria-label="Remove" onClick={() => onRemove(member)}>
                  <IconUserMinus size={18} stroke={1.75} />
                </ActionIcon>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
