import { Group, Table, Text } from '@mantine/core'
import { Eyebrow } from '../ui/Eyebrow'
import { columnCount } from './columns'
import { MotionTr, rowMotion } from './rowMotion'
import { useGroupDrop, type GroupDrop } from './useGroupDrop'

type Props = { label: string; count: number; drop: GroupDrop }

// A row, not a caption, so it enters and leaves with the rows beneath it. A
// task dropped on it joins the group; while a task is dragged a group with
// no tasks is this row alone.
export function TaskGroupHeader({ label, count, drop }: Props) {
  const target = useGroupDrop(`group:${drop.group}`, drop, true)
  return (
    <MotionTr {...rowMotion} {...target}>
      <Table.Td colSpan={columnCount}>
        <Group gap="xs">
          <Eyebrow>{label}</Eyebrow>
          <Text size="xs" c="dimmed">
            {count}
          </Text>
        </Group>
      </Table.Td>
    </MotionTr>
  )
}
