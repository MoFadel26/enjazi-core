import { Kbd, NavLink } from '@mantine/core'
import { useOs } from '@mantine/hooks'
import { spotlight } from '@mantine/spotlight'
import { Icon } from '../ui/Icon'
import { MagnifyingGlassIcon } from '../ui/icons'

// Opens the command palette. Looks like a nav link but is a button outside
// the nav list, so the active-link indicator never lands on it.
export function SearchRow() {
  const os = useOs()

  return (
    <NavLink
      component="button"
      label="Search"
      leftSection={<Icon icon={MagnifyingGlassIcon} />}
      rightSection={<Kbd>{os === 'macos' ? '⌘K' : 'Ctrl K'}</Kbd>}
      onClick={() => spotlight.open()}
    />
  )
}
