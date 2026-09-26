import dayjs from 'dayjs'
import type { Task } from './queries'

// Milliseconds since the epoch, for sorting.
function time(iso: string | null) {
  return iso ? Date.parse(iso) : 0
}

const byDue = (a: Task, b: Task) => time(a.dueAt) - time(b.dueAt)
const newestFirst = (field: 'createdAt' | 'completedAt') => (a: Task, b: Task) => time(b[field]) - time(a[field])

// In display order. docs/design.md, "Screens > Tasks > Groups".
const groups = [
  { key: 'overdue', label: 'Overdue', sort: byDue },
  { key: 'today', label: 'Today', sort: byDue },
  { key: 'week', label: 'This week', sort: byDue },
  { key: 'later', label: 'Later', sort: byDue },
  { key: 'none', label: 'No date', sort: newestFirst('createdAt') },
  { key: 'completed', label: 'Completed', sort: newestFirst('completedAt') },
] as const

export type TaskGroupKey = (typeof groups)[number]['key']
export type TaskGroup = { key: TaskGroupKey; label: string; tasks: Task[] }

// A held task was just completed and lingers where it was, so it groups by
// its due date like an open one.
function groupOf(task: Task, held: ReadonlySet<string>, now: dayjs.Dayjs): TaskGroupKey {
  if (task.completedAt !== null && !held.has(task.id)) return 'completed'
  if (task.dueAt === null) return 'none'
  const due = dayjs(task.dueAt)
  if (due.isBefore(now)) return 'overdue'
  if (!due.isAfter(now.endOf('day'))) return 'today'
  if (!due.isAfter(now.add(7, 'day').endOf('day'))) return 'week'
  return 'later'
}

// Splits the visible tasks into the groups above, leaving out empty ones.
export function groupTasks(tasks: Task[], held: ReadonlySet<string>, now: number): TaskGroup[] {
  const today = dayjs(now)
  return groups
    .map(({ key, label, sort }) => ({
      key,
      label,
      tasks: tasks.filter((task) => groupOf(task, held, today) === key).toSorted(sort),
    }))
    .filter((group) => group.tasks.length > 0)
}
