import { Box, FloatingIndicator, NavLink } from '@mantine/core'
import { useState } from 'react'
import { NavLink as RouterNavLink, useLocation } from 'react-router'
import { Eyebrow } from '../ui/Eyebrow'
import { adminLinks, iconProps, links, type Destination } from './destinations'

type Props = { isAdmin: boolean }

// The sidebar's links. The active one's background is a FloatingIndicator
// that measures that link and slides to it; the theme gives it its look.
export function NavList({ isAdmin }: Props) {
  const { pathname } = useLocation()
  const [parent, setParent] = useState<HTMLDivElement | null>(null)
  const [active, setActive] = useState<HTMLElement | null>(null)

  // Mirrors react-router's own matching so Mantine's active styles and
  // aria-current agree.
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  // Only the active link hands its element to the indicator. React detaches
  // the old link's ref (null) before attaching the new one; with no active
  // link the indicator renders nothing.
  const renderLink = ({ to, label, icon: Icon }: Destination) => (
    <NavLink
      key={to}
      ref={isActive(to) ? setActive : undefined}
      component={RouterNavLink}
      to={to}
      end={to === '/'}
      label={label}
      leftSection={<Icon {...iconProps} />}
      active={isActive(to)}
    />
  )

  return (
    <Box ref={setParent} pos="relative">
      <FloatingIndicator target={active} parent={parent} />
      {links.map(renderLink)}
      {isAdmin && (
        <>
          <Eyebrow px="sm" mt="lg" mb="xs">
            Admin
          </Eyebrow>
          {adminLinks.map(renderLink)}
        </>
      )}
    </Box>
  )
}
