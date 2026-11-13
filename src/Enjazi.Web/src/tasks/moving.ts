import dayjs from 'dayjs'
import type { TaskGroupKey } from './grouping'
import type { Task, TaskChanges } from './queries'

// Every group takes a dropped task except Overdue: nobody files a task as
// already late.
export type DropGroup = Exclude<TaskGroupKey, 'overdue'>

// How many days from today a task dropped on a dated group becomes due.
// Tomorrow is the first day of This week and the eighth day the first of
// Later (grouping.ts).
const daysAhead = { today: 0, week: 1, later: 8 }

// What dropping a task on a group changes (ADR-0020). Completed ticks it and
// leaves its date alone; No date clears the date; a dated group sets one. A
// completed task dropped on any other group is open again.
export function changesFor(task: Task, group: DropGroup, now: number): TaskChanges {
  if (group === 'completed') return { completed: true }
  const dueAt = group === 'none' ? null : dueOn(dayjs(now).add(daysAhead[group], 'day'), task.dueAt)
  return task.completedAt === null ? { dueAt } : { dueAt, completed: false }
}

// The given day at the task's own time of day, or at 23:59 when the task had
// no due date. A kept time that has already passed today leaves the task
// overdue, which is what its date then says.
function dueOn(day: dayjs.Dayjs, dueAt: string | null) {
  if (dueAt === null) return day.hour(23).minute(59).startOf('minute').toISOString()
  const time = dayjs(dueAt)
  return day
    .hour(time.hour())
    .minute(time.minute())
    .second(time.second())
    .millisecond(time.millisecond())
    .toISOString()
}
