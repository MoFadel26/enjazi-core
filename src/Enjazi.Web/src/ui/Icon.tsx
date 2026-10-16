import type { Glyph } from './icons'

// Every icon in the app is a Phosphor glyph drawn through this component, so
// size and weight are decided here. text sits in a line of text or an input,
// control in a nav item or a button, feature on a feature card. The regular
// weight, and fill only for the active item. The colour is the surrounding
// text's: Phosphor paints with currentColor.
const sizes = { text: 16, control: 20, feature: 24 } as const

type Props = { icon: Glyph; size?: keyof typeof sizes; active?: boolean }

export function Icon({ icon: Glyph, size = 'control', active = false }: Props) {
  return <Glyph size={sizes[size]} weight={active ? 'fill' : 'regular'} aria-hidden />
}
