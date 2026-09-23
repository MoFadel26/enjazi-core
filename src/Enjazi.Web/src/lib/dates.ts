import dayjs from 'dayjs'

// @mantine/dates hands values over as "YYYY-MM-DD HH:mm:ss" strings in the
// browser's zone; the API speaks ISO-8601 instants. These two are the only
// place that conversion happens.
const pickerFormat = 'YYYY-MM-DD HH:mm:ss'

export function toPickerValue(iso: string | null): string | null {
  return iso ? dayjs(iso).format(pickerFormat) : null
}

export function fromPickerValue(value: string | null): string | null {
  return value ? dayjs(value).toISOString() : null
}

export function formatDateTime(iso: string): string {
  return dayjs(iso).format('ddd D MMM YYYY, HH:mm')
}

export function formatDate(iso: string): string {
  return dayjs(iso).format('D MMM YYYY')
}
