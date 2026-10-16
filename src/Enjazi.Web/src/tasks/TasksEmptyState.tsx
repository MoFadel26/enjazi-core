import { Button, Kbd } from '@mantine/core'
import { ListChecksIcon } from '@phosphor-icons/react'
import { EmptyState } from '../ui/EmptyState'
import { Icon } from '../ui/Icon'
import type { Filter } from './useTasksView'

type Props = {
  filter: Filter
  hasTasks: boolean
  onAdd: () => void
}

function describe(filter: Filter, hasTasks: boolean) {
  if (!hasTasks) return 'Add your first task to start a streak.'
  return filter === 'done' ? 'Completed tasks show up here.' : 'Everything open is done.'
}

// "Add a task", not "New task": Playwright matches names as substrings and the
// header already has a "New task" button (docs/design.md, "Test contract").
export function TasksEmptyState({ filter, hasTasks, onAdd }: Props) {
  return (
    <EmptyState
      icon={<Icon icon={ListChecksIcon} />}
      title="No tasks here."
      description={describe(filter, hasTasks)}
      action={
        <Button variant="default" rightSection={<Kbd>N</Kbd>} onClick={onAdd}>
          Add a task
        </Button>
      }
    />
  )
}
