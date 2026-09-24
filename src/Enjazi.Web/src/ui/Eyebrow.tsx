import { Text, type TextProps } from '@mantine/core'
import type { ReactNode } from 'react'

type Props = TextProps & { children: ReactNode }

// The small uppercase label over a number or a sidebar section.
export function Eyebrow({ children, ...props }: Props) {
  return (
    <Text size="xs" fw={500} tt="uppercase" c="dimmed" lts="0.4px" {...props}>
      {children}
    </Text>
  )
}
