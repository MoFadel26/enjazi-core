import { useQueryClient } from '@tanstack/react-query'
import type { MantineColorScheme } from '@mantine/core'
import { api } from '../api/client'
import type { components } from '../api/schema'

export type Settings = components['schemas']['SettingsResponse']
export type SettingsRequest = components['schemas']['SettingsRequest']

// The API accepts exactly these three. "system" is Mantine's "auto".
export const themes = ['light', 'dark', 'system'] as const

export function toColorScheme(theme: string): MantineColorScheme {
  return theme === 'light' || theme === 'dark' ? theme : 'auto'
}

const settingsKey = ['get', '/api/settings'] as const

export function useSettings() {
  return api.useQuery('get', '/api/settings')
}

// PUT answers with the saved settings, so the cache takes that answer
// directly rather than refetching what it was just told.
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return api.useMutation('put', '/api/settings', {
    onSuccess: (saved) => queryClient.setQueryData(settingsKey, saved),
  })
}
