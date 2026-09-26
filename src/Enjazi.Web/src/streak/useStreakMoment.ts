import { usePrevious } from '@mantine/hooks'
import { useState } from 'react'
import type { Streak } from './queries'

// Points are the key: they only ever grow, so each rise gets a new float.
export type Rise = { key: number; delta: number }

// The chip's answer to a completion, read from the streak query before and
// after rather than predicted (ADR-0012). Both values stay undefined until
// the data arrives, so the first load plays nothing.
export function useStreakMoment(streak: Streak | undefined) {
  const points = streak?.points
  const length = streak?.currentLength
  const previousPoints = usePrevious(points)
  const previousLength = usePrevious(length)
  const [rise, setRise] = useState<Rise>()
  // The points when the run last grew. They never repeat, so each growth
  // gives the chip's flame a new key and it swells as it mounts.
  const [pop, setPop] = useState<number>()

  // usePrevious differs from the value for one render only, so the rise and
  // the pop are copied into state during that render (React's "adjusting
  // state while rendering"). The key checks stop them repeating on the
  // re-render.
  if (points !== undefined && previousPoints !== undefined && points > previousPoints && rise?.key !== points) {
    setRise({ key: points, delta: points - previousPoints })
  }
  if (length !== undefined && previousLength !== undefined && length > previousLength && pop !== points) {
    setPop(points)
  }

  return { rise, pop }
}
