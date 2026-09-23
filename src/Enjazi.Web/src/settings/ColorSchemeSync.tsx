import { useMantineColorScheme } from '@mantine/core'
import { useEffect } from 'react'
import { toColorScheme, useSettings } from './queries'

// Mantine remembers the colour scheme in localStorage; the account remembers
// it on the server. Once the settings load, the server's answer wins, so a
// new browser shows the theme the user chose elsewhere.
export function ColorSchemeSync() {
  const { data } = useSettings()
  const { setColorScheme } = useMantineColorScheme()
  const theme = data?.theme

  useEffect(() => {
    if (theme !== undefined) setColorScheme(toColorScheme(theme))
  }, [theme, setColorScheme])

  return null
}
