import { CalendarBlankIcon, ChatsCircleIcon, GearIcon, ListChecksIcon, PlusIcon, SquaresFourIcon, UsersIcon } from '../ui/icons'

// Where the sidebar, the command palette and the shortcuts go. `shortcut` is
// tinykeys' syntax: 'g d' is G then D.
export const links = [
  { to: '/', label: 'Dashboard', icon: SquaresFourIcon, shortcut: 'g d' },
  { to: '/tasks', label: 'Tasks', icon: ListChecksIcon, shortcut: 'g t' },
  { to: '/calendar', label: 'Calendar', icon: CalendarBlankIcon, shortcut: 'g c' },
  { to: '/rooms', label: 'Rooms', icon: ChatsCircleIcon, shortcut: 'g r' },
  { to: '/settings', label: 'Settings', icon: GearIcon, shortcut: 'g s' },
] as const

export const adminLinks = [{ to: '/admin/users', label: 'Users', icon: UsersIcon, shortcut: 'g u' }] as const

// The tasks screen opens its create modal on ?new and removes it on close.
export const newTask = { to: '/tasks?new', label: 'New task', icon: PlusIcon, shortcut: 'n' } as const

export type Destination = (typeof links)[number] | (typeof adminLinks)[number] | typeof newTask

// 'g d' as the user reads it in a Kbd: "G D".
export const shortcutLabel = (shortcut: string) => shortcut.toUpperCase()
