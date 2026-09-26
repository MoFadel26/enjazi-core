import { Kbd, NavLink } from '@mantine/core'
import { useOs } from '@mantine/hooks'
import { spotlight } from '@mantine/spotlight'
import { IconSearch } from '@tabler/icons-react'
import { iconProps } from './destinations'

// Opens the command palette. Looks like a nav link but is a button outside
// the nav list, so the active-link indicator never lands on it.
export function SearchRow() {
  const os = useOs()

  return (
    <NavLink
      component="button"
      label="Search"
      leftSection={<IconSearch {...iconProps} />}
      rightSection={<Kbd>{os === 'macos' ? '⌘K' : 'Ctrl K'}</Kbd>}
      onClick={() => spotlight.open()}
    />
  )
}
