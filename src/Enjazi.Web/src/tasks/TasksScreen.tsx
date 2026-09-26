import { Alert, Button, Kbd, SegmentedControl, Tooltip } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { AnimatePresence, type MotionProps } from 'motion/react'
import * as m from 'motion/react-m'
import { describeError } from '../api/errors'
import { StreakChip } from '../streak/StreakChip'
import { transitions } from '../theme/motion'
import { PageHeader } from '../ui/PageHeader'
import { TaskFormModal } from './TaskFormModal'
import { TaskList } from './TaskList'
import { TaskListSkeleton } from './TaskListSkeleton'
import { TasksEmptyState } from './TasksEmptyState'
import { useTaskModal } from './useTaskModal'
import { useTasksView } from './useTasksView'

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: transitions.base,
} satisfies MotionProps

export function TasksScreen() {
  const { tasks, isPending, error, filter, setFilter, linger, groups } = useTasksView()
  const modal = useTaskModal(tasks)

  return (
    <>
      <PageHeader
        title="Tasks"
        actions={
          <>
            <StreakChip />
            <SegmentedControl
              value={filter}
              onChange={setFilter}
              data={[
                { value: 'open', label: 'Open' },
                { value: 'done', label: 'Done' },
                { value: 'all', label: 'All' },
              ]}
            />
            <Tooltip label={<Kbd>N</Kbd>}>
              <Button leftSection={<IconPlus size={18} stroke={1.75} />} onClick={modal.openCreate}>
                New task
              </Button>
            </Tooltip>
          </>
        }
      />

      {isPending && <TaskListSkeleton />}
      {error && <Alert color="red">{describeError(error)}</Alert>}
      {/* mode="wait": the list fades out, still showing its last row, before
          the empty state fades in, and the reverse. initial={false}: data
          arriving replaces the skeleton without a fade. */}
      {tasks && (
        <AnimatePresence mode="wait" initial={false}>
          {groups.length > 0 ? (
            <m.div key="list" {...fade}>
              <TaskList groups={groups} onEdit={modal.openEdit} onComplete={linger} />
            </m.div>
          ) : (
            <m.div key="empty" {...fade}>
              <TasksEmptyState filter={filter} hasTasks={tasks.length > 0} onAdd={modal.openCreate} />
            </m.div>
          )}
        </AnimatePresence>
      )}

      <TaskFormModal task={modal.task} onClose={modal.close} />
    </>
  )
}
