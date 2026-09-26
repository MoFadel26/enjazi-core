import { Paper, Select, Stack, Switch, Text, Title } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import type { ReactNode } from 'react'
import { isPaletteId } from '../theme'
import { PaletteOption } from './PaletteOption'
import { paletteOptions, themes, type SettingsRequest } from './queries'

// Every IANA zone the browser knows, so the list matches what the API
// validates with TimeZoneInfo rather than a hand-kept subset.
const timeZones = Intl.supportedValuesOf('timeZone')

type Form = UseFormReturnType<SettingsRequest>

// Select gives the renderer an option, not a palette; the guard turns its
// value back into an id without a cast.
const renderPalette = ({ option }: { option: { value: string; label: string } }) =>
  isPaletteId(option.value) ? <PaletteOption id={option.value} label={option.label} /> : option.label

// One Paper per group of settings: a card title, a sentence on what it
// changes, then the controls. Paper carries no default padding.
function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Paper p="lg">
      <Stack gap="md">
        <div>
          <Title order={3}>{title}</Title>
          <Text size="sm" c="dimmed" mt={4}>
            {description}
          </Text>
        </div>
        {children}
      </Stack>
    </Paper>
  )
}

export function SettingsForm({ form }: { form: Form }) {
  return (
    <>
      <Section title="Appearance" description="A colour set, and whether it follows light, dark or your device.">
        <Select label="Theme" data={[...themes]} allowDeselect={false} {...form.getInputProps('theme')} />
        <Select
          label="Palette"
          data={paletteOptions}
          allowDeselect={false}
          renderOption={renderPalette}
          {...form.getInputProps('palette')}
        />
      </Section>
      <Section title="Time" description="Due dates and events are shown in this zone.">
        <Select label="Time zone" data={timeZones} searchable allowDeselect={false} {...form.getInputProps('timeZone')} />
      </Section>
      <Section title="Notifications" description="Choose which reminders reach you.">
        <Switch
          label="Email me task reminders"
          {...form.getInputProps('notifications.emailTaskReminders', { type: 'checkbox' })}
        />
        <Switch
          label="Browser task reminders"
          {...form.getInputProps('notifications.browserTaskReminders', { type: 'checkbox' })}
        />
        <Switch label="Room messages" {...form.getInputProps('notifications.roomMessages', { type: 'checkbox' })} />
      </Section>
    </>
  )
}
