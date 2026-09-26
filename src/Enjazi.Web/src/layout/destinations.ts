import {
  IconCalendar,
  IconChecklist,
  IconLayoutDashboard,
  IconMessages,
  IconPlus,
  IconSettings,
  IconUsers,
  type IconProps,
} from '@tabler/icons-react'

export const iconProps: IconProps = { size: 18, stroke: 1.75 }

// Where the sidebar, the command palette and the shortcuts go. `shortcut` is
// tinykeys' syntax: 'g d' is G then D.
export const links = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard, shortcut: 'g d' },
  { to: '/tasks', label: 'Tasks', icon: IconChecklist, shortcut: 'g t' },
  { to: '/calendar', label: 'Calendar', icon: IconCalendar, shortcut: 'g c' },
  { to: '/rooms', label: 'Rooms', icon: IconMessages, shortcut: 'g r' },
  { to: '/settings', label: 'Settings', icon: IconSettings, shortcut: 'g s' },
] as const

export const adminLinks = [{ to: '/admin/users', label: 'Users', icon: IconUsers, shortcut: 'g u' }] as const

// The tasks screen opens its create modal on ?new and removes it on close.
export const newTask = { to: '/tasks?new', label: 'New task', icon: IconPlus, shortcut: 'n' } as const

export type Destination = (typeof links)[number] | (typeof adminLinks)[number] | typeof newTask

// 'g d' as the user reads it in a Kbd: "G D".
export const shortcutLabel = (shortcut: string) => shortcut.toUpperCase()
