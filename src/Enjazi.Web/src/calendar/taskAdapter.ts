import type { EventApi, EventInput } from '@fullcalendar/react'
import dayjs from 'dayjs'
import type { Task } from '../tasks/queries'

// Tasks share the grid with events, so their ids carry a prefix: an event's
// id is a bare GUID, and a click or a drop has to know which one it got.
const prefix = 'task:'

export function taskIdOf(calendarId: string): string | undefined {
  return calendarId.startsWith(prefix) ? calendarId.slice(prefix.length) : undefined
}

// What toTaskInput keeps on a chip for later: whether the task is done, and
// its due instant, which is not always where the chip starts. extendedProps
// is an open record and toTaskInput its only writer.
type TaskProps = { done: boolean; dueAt: string }
const propsOf = (event: EventApi) => event.extendedProps as TaskProps

export const isDoneTask = (event: EventApi) => propsOf(event).done
export const dueAtOf = (event: EventApi) => propsOf(event).dueAt

// How long a task's chip is. A task has a due instant and no length.
const chipMinutes = 30

// A task in the grid, as a chip starting at its due time (ADR-0021). A chip
// may not run past midnight, or the grid draws it in the next day's column
// too, so a task due in the last half hour of its day, such as one due at
// 23:59, is drawn as that last half hour. Its length cannot be changed and it
// cannot be dropped in the all-day row: neither means anything for a task.
// Like toEventInput, this is the typed boundary for FullCalendar's input.
//
// Colours are passed here, not in mantine-bridge.css: FullCalendar writes
// them on the chip's own style attribute, which no stylesheet overrides.
export function toTaskInput(task: Task, dueAt: string): EventInput {
  const due = dayjs(dueAt)
  const latest = due.add(1, 'day').startOf('day').subtract(chipMinutes, 'minute')
  const start = due.isAfter(latest) ? latest : due
  const done = task.completedAt !== null
  const props: TaskProps = { done, dueAt }
  return {
    id: prefix + task.id,
    title: task.title,
    allDay: false,
    start: start.toISOString(),
    // A millisecond short of the chip's length, so a chip that ends at
    // midnight ends inside its own day.
    end: start.add(chipMinutes, 'minute').subtract(1, 'millisecond').toISOString(),
    durationEditable: false,
    allow: (span) => !span.allDay,
    className: done ? 'enjazi-fc-task enjazi-fc-task-done' : 'enjazi-fc-task',
    color: 'var(--enjazi-accent-tint)',
    contrastColor: done ? 'var(--mantine-color-dimmed)' : 'var(--mantine-color-text)',
    extendedProps: props,
  }
}

// Where a dropped chip puts its task's due time: as far from the chip's new
// start as it was from the old one. That is the chip's start itself, except
// for a task drawn as the last half hour of its day, which keeps its minutes
// past the chip's start (a task due at 23:59 dragged to 10:00 is due 10:29).
export function droppedDueAt(event: EventApi, oldStart: Date) {
  const start = event.start
  if (!start) return undefined
  const offset = Date.parse(dueAtOf(event)) - oldStart.getTime()
  return new Date(start.getTime() + offset).toISOString()
}
