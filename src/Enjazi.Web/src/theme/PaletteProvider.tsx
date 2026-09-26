import { MantineProvider } from '@mantine/core'
import { useMemo, type ReactNode } from 'react'
import { palettes } from './palettes'
import { usePaletteId } from './paletteStore'
import { themeFor } from './theme'
import { resolverFor } from './variables'

// MantineProvider, with the theme the active palette builds. Mantine writes
// every colour variable from the theme object, so handing it a new one is the
// whole of a palette change; nothing reloads and no stylesheet is swapped.
export function PaletteProvider({ children }: { children: ReactNode }) {
  const palette = palettes[usePaletteId()]
  const theme = useMemo(() => themeFor(palette), [palette])
  const cssVariablesResolver = useMemo(() => resolverFor(palette), [palette])

  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  )
}
