import { Group, Text, useComputedColorScheme } from '@mantine/core'
import { palettes, type PaletteId } from '../theme'

// A palette cannot be judged from the word "Solarized", so every option shows
// the three colours that decide how it looks — the canvas, the raised surface
// and the accent — in the scheme that is showing.
export function PaletteOption({ id, label }: { id: PaletteId; label: string }) {
  const scheme = useComputedColorScheme('light')
  const palette = palettes[id]
  const canvas = scheme === 'light' ? palette.white : palette.colors.dark[7]
  const swatches = [
    { role: 'canvas', colour: canvas },
    { role: 'raised', colour: palette.schemes[scheme].raised },
    { role: 'accent', colour: palette.colors.accent[palette.primaryShade[scheme]] },
  ]

  return (
    <Group gap="xs" wrap="nowrap">
      <Group gap={2} wrap="nowrap" aria-hidden>
        {/* Keyed by role: two roles can share a colour, as Solarized's canvas
            and raised surface do in light. */}
        {swatches.map(({ role, colour }) => (
          <div
            key={role}
            style={{
              width: 12,
              height: 12,
              borderRadius: 'var(--mantine-radius-xl)',
              backgroundColor: colour,
              border: '1px solid var(--mantine-color-default-border)',
            }}
          />
        ))}
      </Group>
      <Text size="sm">{label}</Text>
    </Group>
  )
}
