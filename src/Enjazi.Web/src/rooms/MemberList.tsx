import { Badge, Button, Table, Text } from '@mantine/core'
import { formatDate } from '../lib/dates'
import type { RoomMember } from './queries'

type Props = {
  members: RoomMember[]
  // Which rows get a Remove button and what happens when it is pressed.
  canRemove: (member: RoomMember) => boolean
  onRemove: (member: RoomMember) => void
}

export function MemberList({ members, canRemove, onRemove }: Props) {
  return (
    <Table verticalSpacing="sm">
      <Table.Tbody>
        {members.map((member) => (
          <Table.Tr key={member.userId}>
            <Table.Td>
              <Text>{member.displayName}</Text>
            </Table.Td>
            <Table.Td w={100}>
              <Badge variant="light" color={member.role === 'Admin' ? 'blue' : 'gray'}>
                {member.role}
              </Badge>
            </Table.Td>
            <Table.Td w={160}>
              <Text size="sm" c="dimmed">
                Joined {formatDate(member.joinedAt)}
              </Text>
            </Table.Td>
            <Table.Td w={100} align="right">
              {canRemove(member) && (
                <Button variant="subtle" size="compact-sm" color="red" onClick={() => onRemove(member)}>
                  Remove
                </Button>
              )}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
