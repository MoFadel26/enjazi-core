import type { EventDropInfo, EventResizeDoneInfo } from '@fullcalendar/react'
import { useMemo, useState } from 'react'
import { useSettings } from '../settings/queries'
import { useTasks, useUpdateTask } from '../tasks/queries'
import { droppedDueAt, taskIdOf, toTaskInput } from './taskAdapter'

// The tasks the calendar draws beside the events, and what clicking and
// dragging one does. The list is the same cached one the Tasks screen reads,
// with its pending writes drawn on top (ADR-0012), so a change made here
// shows there and the other way round.
export function useCalendarTasks() {
  const { data: tasks } = useTasks()
  const { data: settings } = useSettings()
  const update = useUpdateTask()
  const [editingId, setEditingId] = useState<string>()

  // Nothing until the settings say whether completed tasks belong here, so
  // none of them is drawn and then taken away. Tasks with no due date have
  // no place on a calendar.
  const inputs = useMemo(() => {
    if (!tasks || !settings) return []
    return tasks.flatMap((task) => {
      if (task.dueAt === null) return []
      if (task.completedAt !== null && !settings.showCompletedTasksOnCalendar) return []
      return [toTaskInput(task, task.dueAt)]
    })
  }, [tasks, settings])

  // A chip cannot be resized, so this is a drop (droppedDueAt has the new
  // due time). The grid has already moved the chip; the optimistic update
  // draws it there too, and if the request fails the update stops being
  // drawn and the chip goes back, with useUpdateTask's notification. Nothing
  // here calls info.revert().
  function move(info: EventDropInfo | EventResizeDoneInfo) {
    const id = taskIdOf(info.event.id)
    const oldStart = info.oldEvent.start
    const dueAt = oldStart && droppedDueAt(info.event, oldStart)
    if (!id || !dueAt) return info.revert()
    update.mutate({ id, changes: { dueAt } })
  }

  return {
    inputs,
    // undefined: the edit dialog is closed. A task that disappears while it
    // is open, deleted elsewhere, closes it.
    editing: tasks?.find((task) => task.id === editingId),
    edit: setEditingId,
    close: () => setEditingId(undefined),
    move,
  }
}
