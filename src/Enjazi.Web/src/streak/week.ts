import dayjs from 'dayjs'
import type { Streak } from './queries'

export type DayState = 'run' | 'today-open' | 'empty'
export type WeekDay = { key: string; initial: string; state: DayState }

// The last seven days, oldest first, read from the run alone: the API keeps
// the current run, not a log of days (ADR-0012), so a day from an earlier
// run is empty. Today comes from the run where it can, because the server
// counts days in the account's time zone, not the browser's.
export function lastSevenDays(streak: Streak): { days: WeekDay[]; alive: boolean } {
  const length = streak.currentLength
  const last = streak.lastCompletedOn ? dayjs(streak.lastCompletedOn) : null
  const alive = length > 0
  const today =
    last && streak.completedToday ? last : last && alive ? last.add(1, 'day') : dayjs().startOf('day')

  const days = Array.from({ length: 7 }, (_, index): WeekDay => {
    const date = today.subtract(6 - index, 'day')
    // The run is the `length` days ending at the last completion.
    const back = last ? last.diff(date, 'day') : -1
    const state = back >= 0 && back < length ? 'run' : index === 6 && !streak.completedToday ? 'today-open' : 'empty'
    return { key: date.format('YYYY-MM-DD'), initial: date.format('dd').charAt(0), state }
  })
  return { days, alive }
}
