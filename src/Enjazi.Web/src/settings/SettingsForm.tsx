import { Select, Switch } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import { themes, type SettingsRequest } from './queries'

// Every IANA zone the browser knows, so the list matches what the API
// validates with TimeZoneInfo rather than a hand-kept subset.
const timeZones = Intl.supportedValuesOf('timeZone')

export function SettingsForm({ form }: { form: UseFormReturnType<SettingsRequest> }) {
  return (
    <>
      <Select label="Theme" data={[...themes]} allowDeselect={false} {...form.getInputProps('theme')} />
      <Select label="Time zone" data={timeZones} searchable allowDeselect={false} {...form.getInputProps('timeZone')} />
      <Switch
        label="Email me task reminders"
        {...form.getInputProps('notifications.emailTaskReminders', { type: 'checkbox' })}
      />
      <Switch
        label="Browser task reminders"
        {...form.getInputProps('notifications.browserTaskReminders', { type: 'checkbox' })}
      />
      <Switch label="Room messages" {...form.getInputProps('notifications.roomMessages', { type: 'checkbox' })} />
    </>
  )
}
