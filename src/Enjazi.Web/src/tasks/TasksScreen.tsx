import { Alert, Button, Loader, SegmentedControl } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'
import { describeError } from '../api/errors'
import { PageHeader } from '../ui/PageHeader'
import { TaskFormModal } from './TaskFormModal'
import { TaskList } from './TaskList'
import { useTasks, type Task } from './queries'

type Filter = 'open' | 'done' | 'all'

// The list is one request and the filter is applied here: the API has no
// filter parameter and a personal task list is small enough not to need one.
export function TasksScreen() {
  const { data: tasks, isPending, error } = useTasks()
  const [filter, setFilter] = useState<Filter>('open')
  // undefined: closed. null: creating. A task: editing it.
  const [editing, setEditing] = useState<Task | null | undefined>(undefined)

  const visible = (tasks ?? []).filter((task) =>
    filter === 'all' ? true : filter === 'done' ? task.completedAt !== null : task.completedAt === null,
  )

  return (
    <>
      <PageHeader
        title="Tasks"
        actions={
          <>
            <SegmentedControl
              value={filter}
              onChange={(value) => setFilter(value as Filter)}
              data={[
                { value: 'open', label: 'Open' },
                { value: 'done', label: 'Done' },
                { value: 'all', label: 'All' },
              ]}
            />
            <Button leftSection={<IconPlus size={18} stroke={1.75} />} onClick={() => setEditing(null)}>
              New task
            </Button>
          </>
        }
      />

      {isPending && <Loader />}
      {error && <Alert color="red">{describeError(error)}</Alert>}
      {tasks && <TaskList tasks={visible} onEdit={setEditing} />}

      {editing !== undefined && (
        <TaskFormModal key={editing?.id ?? 'new'} task={editing} onClose={() => setEditing(undefined)} />
      )}
    </>
  )
}
