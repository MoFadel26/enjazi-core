import { Box, Group, Skeleton, Table } from '@mantine/core'
import { columnCount, columnWidths } from './columns'

const rows = Array.from({ length: 5 }, (_, row) => row)

// The height of one line of the group header's Eyebrow: xs text at xs line
// height.
const eyebrowLine = 'calc(var(--mantine-font-size-xs) * var(--mantine-line-height-xs))'
// ActionIcon's md size, the tallest thing in a row without a description.
const actionIcon = 28

// Shaped like TaskList: one group header, then rows with TaskRow's cells and
// column widths, so nothing moves when the list arrives. The progressbar
// wraps the table rather than replacing its role. ARIA makes a progressbar's
// children presentational, which is what placeholder rows are.
export function TaskListSkeleton() {
  return (
    <Box role="progressbar" aria-label="Loading tasks">
      <Table>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td colSpan={columnCount}>
              <Skeleton height={eyebrowLine} width={72} />
            </Table.Td>
          </Table.Tr>
          {rows.map((row) => (
            <Table.Tr key={row}>
              <Table.Td w={columnWidths.check}>
                <Skeleton height={20} width={20} />
              </Table.Td>
              <Table.Td>
                <Skeleton height={14} width="40%" />
              </Table.Td>
              <Table.Td w={columnWidths.priority}>
                <Group gap="xs" wrap="nowrap">
                  <Skeleton height={6} circle />
                  <Skeleton height={12} width={48} />
                </Group>
              </Table.Td>
              <Table.Td w={columnWidths.due}>
                <Skeleton height={12} width={140} />
              </Table.Td>
              <Table.Td w={columnWidths.actions}>
                <Group gap="xs" justify="flex-end" wrap="nowrap">
                  <Skeleton height={actionIcon} width={actionIcon} />
                  <Skeleton height={actionIcon} width={actionIcon} />
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  )
}
