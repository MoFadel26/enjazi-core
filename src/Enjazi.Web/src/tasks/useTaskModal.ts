import { useSearchParams } from 'react-router'
import type { Task } from './queries'

// The modal lives in the URL: ?new creates, ?edit=<id> edits. The N key and
// the command palette open it by navigating (ADR-0012), and the buttons on
// this screen take the same path. Replace, not push, so closing leaves no
// history entry that would reopen it.
export function useTaskModal(tasks: Task[] | undefined) {
  const [params, setParams] = useSearchParams()
  const editId = params.get('edit')

  // undefined: closed. null: creating. A task: editing it. An edit waits for
  // the list, and an id that is not in it opens nothing.
  const task = params.has('new') ? null : tasks?.find((item) => item.id === editId)

  return {
    task,
    openCreate: () => setParams({ new: '' }, { replace: true }),
    openEdit: (item: Task) => setParams({ edit: item.id }, { replace: true }),
    close: () => setParams({}, { replace: true }),
  }
}
