import { useQueryClient } from '@tanstack/react-query'
import type { MantineColorScheme } from '@mantine/core'
import { api } from '../api/client'
import { paletteIds, palettes } from '../theme'
import type { components } from '../api/schema'

export type Settings = components['schemas']['SettingsResponse']
export type SettingsRequest = components['schemas']['SettingsRequest']

// The API accepts exactly these three. "system" is Mantine's "auto".
export const themes = ['light', 'dark', 'system'] as const

// The same list the API validates against, shown by name.
export const paletteOptions = paletteIds.map((id) => ({ value: id, label: palettes[id].label }))

export function toColorScheme(theme: string): MantineColorScheme {
  return theme === 'light' || theme === 'dark' ? theme : 'auto'
}

// The reverse, for what Mantine holds before an account exists.
export function toTheme(scheme: MantineColorScheme): (typeof themes)[number] {
  return scheme === 'auto' ? 'system' : scheme
}

const settingsKey = ['get', '/api/settings'] as const

export function useSettings() {
  return api.useQuery('get', '/api/settings')
}

// The landing page's theme toggle, for someone signed in. The account keeps
// the choice, so ColorSchemeSync in the app does not put the old one back.
// PUT takes every setting, so the current ones are read first; with none
// loaded yet the toggle only changes this browser, as for a visitor.
export function useSaveTheme(signedIn: boolean) {
  const { data: settings } = api.useQuery('get', '/api/settings', undefined, { enabled: signedIn })
  const update = useUpdateSettings()
  return (theme: 'light' | 'dark') => {
    if (!signedIn || !settings) return
    const { palette, timeZone, notifications } = settings
    update.mutate({ body: { theme, palette, timeZone, notifications } })
  }
}

// PUT answers with the saved settings, so the cache takes that answer
// directly rather than refetching what it was just told.
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return api.useMutation('put', '/api/settings', {
    onSuccess: (saved) => queryClient.setQueryData(settingsKey, saved),
  })
}
