import { useState } from 'react'

// For a modal that stays mounted so Mantine's transition plays on open and
// close. The parent clears its value (undefined: closed) the moment the modal
// closes; this returns the value while there is one and the last one after,
// so the modal keeps showing it while it leaves. Set during render, which
// React applies before painting.
export function useLastDefined<T>(value: T | undefined): T | undefined {
  const [last, setLast] = useState(value)
  if (value !== undefined && value !== last) setLast(value)
  return value === undefined ? last : value
}
