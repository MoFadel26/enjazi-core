import { useSyncExternalStore } from 'react'
import { defaultPaletteId, isPaletteId, type PaletteId } from './palettes'

// Which palette is showing. A store outside React's tree, mirrored to
// localStorage the way Mantine mirrors the colour scheme: the first render
// reads it synchronously, so a returning browser paints the right palette
// instead of the default and then the account's answer. PaletteSync writes the
// account's answer here once the settings load.
export const paletteStorageKey = 'enjazi-palette'

function stored(): PaletteId {
  const value = localStorage.getItem(paletteStorageKey)
  return value !== null && isPaletteId(value) ? value : defaultPaletteId
}

let current = stored()
const listeners = new Set<() => void>()

// The attribute the browser tests read, set outside React so it is already
// right on the first paint.
function mark(id: PaletteId) {
  document.documentElement.dataset.enjaziPalette = id
}

mark(current)

export function setPaletteId(id: PaletteId) {
  if (id === current) return
  current = id
  localStorage.setItem(paletteStorageKey, id)
  mark(id)
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePaletteId() {
  return useSyncExternalStore(subscribe, () => current)
}
