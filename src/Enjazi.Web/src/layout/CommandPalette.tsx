import { Kbd } from '@mantine/core'
import { Spotlight, type SpotlightActionData, type SpotlightActionGroupData } from '@mantine/spotlight'
import { IconSquare } from '@tabler/icons-react'
import { useNavigate } from 'react-router'
import { useTasks } from '../tasks/queries'
import { adminLinks, iconProps, links, newTask, shortcutLabel, type Destination } from './destinations'

type Props = { isAdmin: boolean }

// The command palette, opened by useShortcuts' mod+K and the sidebar's Search
// row. Closed, its Modal unmounts, so none of these actions is in the page to
// collide with a screen's own "New task".
export function CommandPalette({ isAdmin }: Props) {
  const navigate = useNavigate()
  const { data: tasks = [] } = useTasks()

  const go = ({ to, label, icon: Icon, shortcut }: Destination): SpotlightActionData => ({
    id: to,
    label,
    leftSection: <Icon {...iconProps} />,
    rightSection: <Kbd>{shortcutLabel(shortcut)}</Kbd>,
    onClick: () => navigate(to),
  })

  const actions: SpotlightActionGroupData[] = [
    { group: 'Go to', actions: [...links, ...(isAdmin ? adminLinks : [])].map(go) },
    { group: 'Create', actions: [go(newTask)] },
    {
      group: 'Tasks',
      // The tasks screen opens this task's edit modal on ?edit=<id>.
      actions: tasks
        .filter((task) => task.completedAt === null)
        .map((task) => ({
          id: task.id,
          label: task.title,
          leftSection: <IconSquare {...iconProps} />,
          onClick: () => navigate(`/tasks?edit=${task.id}`),
        })),
    },
  ]

  // Spotlight's Modal has no title to name it, and its other props land on
  // the root, not the role="dialog" section; attributes.content reaches that.
  // shortcut={null} drops Spotlight's own mod+K, whose filter looks only at
  // tag names, so it opened over a modal and skipped a focused checkbox.
  return (
    <Spotlight
      shortcut={null}
      attributes={{ content: { 'aria-label': 'Command palette' } }}
      actions={actions}
      nothingFound="Nothing found."
      searchProps={{ placeholder: 'Search or jump to…' }}
      scrollable
    />
  )
}
