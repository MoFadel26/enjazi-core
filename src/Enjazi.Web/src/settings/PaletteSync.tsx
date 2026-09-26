import { useEffect } from 'react'
import { isPaletteId, setPaletteId } from '../theme'
import { useSettings } from './queries'

// The store remembers the palette in localStorage; the account remembers it on
// the server. Once the settings load, the server's answer wins, so a new
// browser shows the palette the user chose elsewhere.
//
// The effect watches the account's value alone. Watching the store as well
// would undo the settings screen's live preview one render after it was
// picked.
export function PaletteSync() {
  const { data } = useSettings()
  const palette = data?.palette

  useEffect(() => {
    if (palette !== undefined && isPaletteId(palette)) setPaletteId(palette)
  }, [palette])

  return null
}
