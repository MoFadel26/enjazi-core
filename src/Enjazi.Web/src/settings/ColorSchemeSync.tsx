import { useMantineColorScheme } from '@mantine/core'
import { useEffect } from 'react'
import { toColorScheme, useSettings } from './queries'

// Mantine remembers the colour scheme in localStorage; the account remembers
// it on the server. Once the settings load, the server's answer wins, so a
// new browser shows the theme the user chose elsewhere.
//
// Only when they differ: setColorScheme switches every CSS transition off for
// a moment, and Mantine hands out a new setColorScheme on each render, so an
// unconditional call cut short any transition running as the layout rendered.
export function ColorSchemeSync() {
  const { data } = useSettings()
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const theme = data?.theme

  useEffect(() => {
    if (theme !== undefined && toColorScheme(theme) !== colorScheme) setColorScheme(toColorScheme(theme))
  }, [theme, colorScheme, setColorScheme])

  return null
}
