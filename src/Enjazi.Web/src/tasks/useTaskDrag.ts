import {
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DndContextProps,
  type DragEndEvent,
  type DragMoveEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import { useCallback, useState } from 'react'
import { accessibility, onHeader, toNextGroup } from './dragAccessibility'
import type { TaskGroup, TaskGroupKey } from './grouping'
import { changesFor } from './moving'
import type { Task, TaskChanges } from './queries'
import { dropOf, type GroupDrop } from './useGroupDrop'

// Dragging a task by its handle onto another group moves it there (ADR-0020).
// This holds the drag's state and everything DndContext needs.
export function useTaskDrag(groups: TaskGroup[], onMove: (task: Task, changes: TaskChanges) => void) {
  const [draggedId, setDraggedId] = useState<string>()
  const [overGroup, setOverGroup] = useState<TaskGroupKey>()
  // Whether the task has been carried out of its place. The rows slide when
  // the empty groups appear (TaskTable), and a group that lands under a
  // pointer that has not moved, or under the copy of a task just picked up
  // with a key, was not chosen: letting go there moves nothing.
  const [carried, setCarried] = useState(false)
  // An arrow key that finds a group has carried the task there, even when
  // the copy already stood where that group's header opened and does not move.
  const coordinateGetter = useCallback<KeyboardCoordinateGetter>((event, args) => {
    const coordinates = toNextGroup(event, args)
    if (coordinates) setCarried(true)
    return coordinates
  }, [])
  const sensors = useSensors(
    // A press on the handle that does not travel is not a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter }),
  )

  const source = groups.find((group) => group.tasks.some((task) => task.id === draggedId))
  const dragged = source?.tasks.find((task) => task.id === draggedId)

  // A carried task drops on the row under the pointer or, with no pointer,
  // on the header the arrow keys put it on.
  const collisionDetection: CollisionDetection = (args) => {
    if (!carried) return []
    return args.pointerCoordinates ? pointerWithin(args) : onHeader(args)
  }

  // A pointer has carried the task once it is half the row's own height
  // away from where it was.
  function move({ active, delta }: DragMoveEvent) {
    const height = active.rect.current.initial?.height ?? 0
    if (Math.hypot(delta.x, delta.y) > height / 2) setCarried(true)
  }

  function stop() {
    setDraggedId(undefined)
    setOverGroup(undefined)
    setCarried(false)
  }

  function drop({ over }: DragEndEvent) {
    stop()
    const group = over && dropOf(over).group
    // Disabled targets are never `over`, so Overdue cannot be: the check
    // narrows the type.
    if (!dragged || !group || group === 'overdue') return
    onMove(dragged, changesFor(dragged, group, Date.now()))
  }

  const context = {
    sensors,
    collisionDetection,
    accessibility,
    onDragStart: ({ active }) => setDraggedId(String(active.id)),
    onDragMove: move,
    onDragOver: ({ over }) => setOverGroup(over ? dropOf(over).group : undefined),
    onDragEnd: drop,
    onDragCancel: stop,
  } satisfies DndContextProps

  // The task's own group takes no drop either: it is already there.
  const dropOn = ({ key, label }: TaskGroup): GroupDrop => ({
    group: key,
    label,
    disabled: key === 'overdue' || key === source?.key,
    over: key === overGroup,
  })

  return { context, dragged, dropOn }
}
