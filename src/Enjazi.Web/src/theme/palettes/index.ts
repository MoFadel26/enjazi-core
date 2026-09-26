import { dracula } from './dracula'
import { enjazi } from './enjazi'
import { nord } from './nord'
import { solarized } from './solarized'
import { paletteIds, type Palette, type PaletteId } from './types'

export { paletteIds }
export type { Palette, PaletteId, SchemeColors } from './types'

export const palettes: Record<PaletteId, Palette> = { enjazi, nord, solarized, dracula }

// What an account that has never chosen gets, and what the API defaults to.
export const defaultPaletteId: PaletteId = 'enjazi'

// The account and localStorage both hand back a plain string.
export function isPaletteId(value: string): value is PaletteId {
  return (paletteIds as readonly string[]).includes(value)
}
