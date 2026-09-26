import { ActionIcon, Badge, Box, Group, Skeleton, Table, Text } from '@mantine/core'
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
              <Badge color={member.role === 'Admin' ? 'accent' : 'gray'}>{member.role}</Badge>
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

// Three rows shaped like the ones above while the members load: the avatar,
// the name and date lines (two bars as tall as both together), the role badge.
export function MemberListSkeleton() {
  return (
    <Table role="progressbar" aria-label="Loading members">
      <Table.Tbody>
        {[0, 1, 2].map((row) => (
          <Table.Tr key={row}>
            <Table.Td>
              <Group gap="xs" wrap="nowrap">
                <Skeleton circle height={24} />
                <Box>
                  <Skeleton height={17} width={120} />
                  <Skeleton height={17} width={88} mt={4} />
                </Box>
              </Group>
            </Table.Td>
            <Table.Td>
              <Skeleton height={18} width={56} />
            </Table.Td>
            <Table.Td w={36} />
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
