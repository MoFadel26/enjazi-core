import { useDroppable, type Active, type DroppableContainer, type Over } from '@dnd-kit/core'
import type { TaskGroupKey } from './grouping'

// What the list tells each row of a group about dropping on it. Overdue and
// the dragged task's own group are disabled; `over` is set on the group the
// dragged task is above.
export type GroupDrop = { group: TaskGroupKey; label: string; disabled: boolean; over: boolean }

// What a dragged task and a drop target carry, read back by the drag's
// handlers and its announcements.
type DragData = { title: string }
type DropData = { group: TaskGroupKey; label: string; header: boolean }

// dnd-kit types `data` as an open record. Only TaskRow and TaskGroupHeader
// register with this context, and they do it through these two functions.
export const dragData = (task: { title: string }): DragData => ({ title: task.title })
export const titleOf = (active: Active) => (active.data.current as DragData).title
export const dropOf = (target: Over | DroppableContainer) => target.data.current as DropData

// Every row of a group is a drop target for the whole group: the header and
// each task row. The group the dragged task is above is tinted, and marked
// for the tests (docs/design.md, "Test contract").
export function useGroupDrop(id: string, drop: GroupDrop, header: boolean) {
  const data: DropData = { group: drop.group, label: drop.label, header }
  const { setNodeRef } = useDroppable({ id, disabled: drop.disabled, data })
  return {
    ref: setNodeRef,
    bg: drop.over ? 'var(--enjazi-accent-tint)' : undefined,
    mod: { 'drop-over': drop.over },
  }
}
