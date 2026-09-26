import { useSet } from '@mantine/hooks'
import { useRef } from 'react'
import { durations } from '../theme/motion'

// A task ticked in the list stays in its group, struck through, for
// durations.linger before it leaves (ADR-0012). This holds the ids still in
// that pause. Each id has its own timer, so ticking another task does not
// cut this one's pause short, and ticking the same task again restarts it.
export function useLinger() {
  const lingering = useSet<string>()
  const timers = useRef(new Map<string, number>())

  function linger(id: string) {
    window.clearTimeout(timers.current.get(id))
    lingering.add(id)
    timers.current.set(id, window.setTimeout(() => lingering.delete(id), durations.linger))
  }

  return { lingering, linger }
}
