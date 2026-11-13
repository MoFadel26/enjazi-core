import { VisuallyHidden } from '@mantine/core'
import dayjs from 'dayjs'
import { Icon } from '../ui/Icon'
import { CheckSquareIcon, SquareIcon } from '../ui/icons'

type Props = { title: string; dueAt: string; done: boolean; timeClass: string; titleClass: string }

// What a task's chip shows: its due time, which is not always where the
// chip starts (taskAdapter.ts), then a box ticked or not and the title.
// Hidden text tells a screen reader it is a task and not an event. The two
// classes are FullCalendar's, so the chip keeps the event chips' type.
export function TaskChip({ title, dueAt, done, timeClass, titleClass }: Props) {
  return (
    <>
      <div className={timeClass}>{dayjs(dueAt).format('HH:mm')}</div>
      <div className={titleClass}>
        <span className="enjazi-fc-task-icon">
          <Icon icon={done ? CheckSquareIcon : SquareIcon} size="text" />
        </span>
        <VisuallyHidden>{done ? 'Completed task: ' : 'Task: '}</VisuallyHidden>
        {title}
      </div>
    </>
  )
}
