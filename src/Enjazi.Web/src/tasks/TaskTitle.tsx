import { TextInput, UnstyledButton } from '@mantine/core'
import { useRef, useState } from 'react'
import type { Task } from './queries'

type Props = {
  task: Task
  onRename: (title: string) => void
}

// The title renames in place; Edit still opens the modal for everything else.
export function TaskTitle({ task, onRename }: Props) {
  const [renaming, setRenaming] = useState(false)
  // Set when Enter or Escape ends a rename, so focus returns to the title
  // instead of falling to the page.
  const refocus = useRef(false)
  const done = task.completedAt !== null

  if (renaming) {
    return (
      <TextInput
        aria-label="Task title"
        defaultValue={task.title}
        autoFocus
        onBlur={(event) => {
          setRenaming(false)
          const title = event.currentTarget.value.trim()
          if (title && title !== task.title) onRename(title)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== 'Escape') return
          // Both keys leave through blur, so there is one save path. Escape
          // first puts the title back, which blur then treats as unchanged.
          // preventDefault stops Enter from also pressing the title button.
          if (event.key === 'Escape') event.currentTarget.value = task.title
          event.preventDefault()
          refocus.current = true
          event.currentTarget.blur()
        }}
      />
    )
  }

  return (
    <UnstyledButton
      ref={(node) => {
        if (node && refocus.current) node.focus()
        refocus.current = false
      }}
      td={done ? 'line-through' : undefined}
      c={done ? 'dimmed' : undefined}
      onClick={() => setRenaming(true)}
    >
      {task.title}
    </UnstyledButton>
  )
}
