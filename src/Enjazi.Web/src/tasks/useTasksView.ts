import { useState } from 'react'
import { groupTasks } from './grouping'
import { useTasks } from './queries'
import { useLinger } from './useLinger'

export type Filter = 'open' | 'done' | 'all'

const nothingHeld: ReadonlySet<string> = new Set()

// The list is one request and the filter is applied here: the API has no
// filter parameter and a personal task list is small enough not to need one.
// Grouping works the same way.
export function useTasksView() {
  const { data: tasks, isPending, error, dataUpdatedAt } = useTasks()
  const [filter, setFilter] = useState<Filter>('open')
  const { lingering, linger } = useLinger()
  // "Now" is when the list last came from the server: it moves on every fetch
  // and every saved change, and never between two renders of the same data.
  const now = dataUpdatedAt

  // Done shows completed tasks where they belong, so nothing lingers there.
  const held = filter === 'done' ? nothingHeld : lingering
  const visible = (tasks ?? []).filter((task) => {
    const open = task.completedAt === null
    if (filter === 'done') return !open
    return filter === 'all' || open || held.has(task.id)
  })

  return { tasks, isPending, error, filter, setFilter, linger, groups: groupTasks(visible, held, now) }
}
