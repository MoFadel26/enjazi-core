import { Box, Button, Stack, Text, type ButtonProps } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

type Props = ButtonProps & {
  children: ReactNode
  onConfirm: () => void
  // How long to hold, in milliseconds.
  duration?: number
  // The button's description, shown below it and read with its name.
  hint?: string
}

const holdKeys = new Set([' ', 'Enter'])

// A destructive action that runs only once the button has been held for the
// whole duration, with the pointer or with Space or Enter. Letting go early
// cancels. A bar along the bottom edge, in the label's colour, fills over
// the duration; the hover already paints the whole button, so a full fill
// would not show. Under reduced motion there is no bar; a second line,
// "Keep holding…", shows while it is held either way and is announced. The
// hint stays the same throughout, so the description does not change.
export function HoldButton({ children, onConfirm, duration = 2000, hint, ...props }: Props) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const reduceMotion = useReducedMotion()
  const hintId = useId()
  const seconds = duration / 1000

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const start = () => {
    if (holding || props.loading || props.disabled) return
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      onConfirm()
    }, duration)
  }

  const stop = () => {
    window.clearTimeout(timer.current)
    setHolding(false)
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!holdKeys.has(event.key)) return
    event.preventDefault()
    if (!event.repeat) start()
  }

  return (
    <Stack gap={4} align="flex-start">
      <Button
        {...props}
        aria-describedby={hintId}
        onPointerDown={(event) => event.button === 0 && start()}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => holdKeys.has(event.key) && stop()}
        onBlur={stop}
        // A long press on a phone would otherwise open the context menu.
        onContextMenu={(event) => event.preventDefault()}
      >
        {!reduceMotion && (
          <Box
            component="span"
            aria-hidden
            pos="absolute"
            left={0}
            right={0}
            bottom={0}
            h={3}
            bg="currentColor"
            style={{
              transformOrigin: 'left',
              transform: `scaleX(${holding ? 1 : 0})`,
              transition: holding ? `transform ${duration}ms linear` : 'none',
            }}
          />
        )}
        <Box component="span" pos="relative">
          {children}
        </Box>
      </Button>
      <Text id={hintId} size="xs" c="dimmed">
        {hint ?? `Press and hold for ${seconds} seconds.`}
      </Text>
      <Text size="xs" c="dimmed" aria-live="polite">
        {holding ? 'Keep holding…' : ''}
      </Text>
    </Stack>
  )
}
