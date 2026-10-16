import type { MantineColorShade, MantineColorsTuple } from '@mantine/core'

// The four palettes, in the order the settings picker shows them. The API
// validates the same list (SettingsController.Palettes) and
// scripts/verify-phase-9.sh checks the two agree.
export const paletteIds = ['enjazi', 'nord', 'solarized', 'dracula'] as const

export type PaletteId = (typeof paletteIds)[number]

// One scheme's own colours. The surfaces exist because Mantine 9 paints
// Paper, Card, Modal and AppShell panels with the canvas; the four text
// colours exist because Mantine's own <colour>-text variables do not clear
// 4.5:1 on every surface. docs/design.md, "Colour".
export type SchemeColors = {
  surface1: string
  surface2: string
  surface3: string
  raised: string
  accentTint: string
  // The secondary button's border and hover fill. Its own fill is transparent.
  control: { border: string; hover: string }
  // The primary's label, hover fill and press fill, where Mantine's own do
  // not fit: its label is theme.black or white, its hover the next shade
  // down the ramp, and it has no press fill.
  primary?: { label: string; hover: string; active: string }
  // accent only where the filled shade is too pale to read as text; links
  // and the accent's -text variable then use it instead.
  text: { accent?: string; red: string; green: string; orange: string; yellow: string }
}

// A palette is only colour: structure, type, space and motion are the same in
// all of them. The three tuples are ordered by the indexes Mantine reads for
// its semantic variables, which docs/design.md, "Roles" lists.
export type Palette = {
  id: PaletteId
  label: string
  primaryShade: { light: MantineColorShade; dark: MantineColorShade }
  black: string
  white: string
  colors: { accent: MantineColorsTuple; dark: MantineColorsTuple; gray: MantineColorsTuple }
  schemes: { light: SchemeColors; dark: SchemeColors }
}
