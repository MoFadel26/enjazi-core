import { Alert, Button, Group, Stack, useMantineColorScheme } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useEffect, useRef } from 'react'
import { describeError } from '../api/errors'
import { isPaletteId, setPaletteId } from '../theme'
import { PageHeader } from '../ui/PageHeader'
import { SettingsForm } from './SettingsForm'
import { SettingsSkeleton } from './SettingsSkeleton'
import { toColorScheme, useSettings, useUpdateSettings, type Settings } from './queries'

export function SettingsScreen() {
  const { data: settings, isPending, error } = useSettings()

  return (
    <>
      <PageHeader title="Settings" />
      {isPending && <SettingsSkeleton />}
      {error && <Alert color="red">{describeError(error)}</Alert>}
      {settings && <LoadedForm settings={settings} />}
    </>
  )
}

// Split so the form's initial values come from loaded data, not from a
// placeholder that a later load would have to overwrite.
function LoadedForm({ settings }: { settings: Settings }) {
  const update = useUpdateSettings()
  const { setColorScheme } = useMantineColorScheme()
  const form = useForm({
    initialValues: {
      theme: settings.theme,
      palette: settings.palette,
      timeZone: settings.timeZone,
      notifications: { ...settings.notifications },
    },
  })

  // The whole screen is the palette's preview, so the choice shows as it is
  // picked. A ref holds what the account says, so leaving without saving puts
  // that back: the live change must not be a silent save.
  const picked = form.getValues().palette
  const saved = useRef(settings.palette)

  useEffect(() => {
    saved.current = settings.palette
  }, [settings.palette])

  useEffect(() => {
    if (isPaletteId(picked)) setPaletteId(picked)
  }, [picked])

  useEffect(
    () => () => {
      if (isPaletteId(saved.current)) setPaletteId(saved.current)
    },
    [],
  )

  return (
    <form
      onSubmit={form.onSubmit((values) =>
        update.mutate(
          { body: values },
          {
            onSuccess: (saved) => {
              if (saved) {
                form.resetDirty(values)
                setColorScheme(toColorScheme(saved.theme))
              }
              notifications.show({ message: 'Settings saved.' })
            },
          },
        ),
      )}
    >
      <Stack maw={560}>
        <SettingsForm form={form} />
        {update.error && <Alert color="red">{describeError(update.error)}</Alert>}
        <Group justify="flex-end">
          <Button type="submit" loading={update.isPending} disabled={!form.isDirty()}>
            Save
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
