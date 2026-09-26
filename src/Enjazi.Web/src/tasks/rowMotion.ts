import { Table } from '@mantine/core'
import type { MotionProps } from 'motion/react'
import * as m from 'motion/react-m'
import { offsets, transitions } from '../theme/motion'

// Mantine's Table.Tr passes its ref (a plain prop in React 19) through Box to
// the <tr>, so motion drives the real row and the row keeps Mantine's classes,
// hover and borders.
export const MotionTr = m.create(Table.Tr)

// Rows rise in, fade out, and slide when a row above them comes or goes.
export const rowMotion = {
  initial: { opacity: 0, y: offsets.enter },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  layout: 'position',
  transition: transitions.base,
} satisfies MotionProps
