import {
  getClientRect,
  type Announcements,
  type ClientRect,
  type CollisionDetection,
  type DroppableContainer,
  type KeyboardCoordinateGetter,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { dropOf, titleOf } from './useGroupDrop'

// Read out when a Move handle takes focus.
const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    'To move this task to another group, press Space or Enter. Choose a group with the Up and Down arrow keys, then press Space or Enter to move the task there, or Escape to leave it where it is.',
}

// dnd-kit's own announcements name things by id; these use the task's title
// and the group's label.
const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${titleOf(active)}.`,
  onDragOver: ({ active, over }) =>
    over ? `${titleOf(active)} is over ${dropOf(over).label}.` : `${titleOf(active)} is not over a group.`,
  onDragEnd: ({ active, over }) =>
    over ? `${titleOf(active)} was moved to ${dropOf(over).label}.` : `${titleOf(active)} was not moved.`,
  onDragCancel: ({ active }) => `${titleOf(active)} was not moved.`,
}

export const accessibility = { announcements, screenReaderInstructions }

// A keyboard drag goes from group to group, not pixel by pixel, and the copy
// of the dragged task stands on a group's header row. Each enabled header,
// with where its top is and how far off the copy's top may be and still
// count as on it.
function headers(containers: DroppableContainer[], rects: Map<UniqueIdentifier, ClientRect>) {
  return containers.flatMap((container) => {
    const rect = rects.get(container.id)
    return rect && dropOf(container).header ? { id: container.id, top: rect.top, reach: rect.height / 2 } : []
  })
}

// Down puts the dragged task on the header of the next group that takes it,
// Up on the previous one. Next and previous are counted from the header the
// task is on or, until it is on one, from its own row, wherever the dragged
// copy happens to be. Coordinates are the copy's top left corner.
export const toNextGroup: KeyboardCoordinateGetter = (event, { context }) => {
  const direction = event.code === 'ArrowDown' ? 1 : event.code === 'ArrowUp' ? -1 : 0
  const { activeNode, collisionRect, droppableContainers, droppableRects, over } = context
  if (direction === 0 || !collisionRect || !activeNode) return
  // Otherwise the arrows also scroll the page.
  event.preventDefault()

  // The row may still be sliding; its place in the layout is what counts.
  const from = over ? collisionRect.top : getClientRect(activeNode, { ignoreTransform: true }).top
  const tops = headers(droppableContainers.getEnabled(), droppableRects)
    .filter(({ top, reach }) => (top - from) * direction >= reach)
    .map(({ top }) => top)
  if (tops.length === 0) return
  return { x: collisionRect.left, y: direction > 0 ? Math.min(...tops) : Math.max(...tops) }
}

// The header the copy of a task dragged by keyboard is on, if any.
export const onHeader: CollisionDetection = ({ collisionRect, droppableContainers, droppableRects }) =>
  headers(droppableContainers, droppableRects)
    .filter(({ top, reach }) => Math.abs(top - collisionRect.top) < reach)
    .map(({ id }) => ({ id }))
