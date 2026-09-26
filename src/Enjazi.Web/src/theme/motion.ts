import type { Transition } from 'motion/react'

// Every duration and easing in the design system. docs/design.md, "Motion".
// Milliseconds, because Mantine's transition props and timers take them; the
// resolver turns fast into a --enjazi-* variable for CSS.
export const durations = {
  // Hover, press, colour changes, the checkbox tick, tooltips.
  fast: 120,
  // Enter and leave: modals, popovers, notifications, rows, the nav marker,
  // the mobile navbar.
  base: 180,
  // The points float and the flame pop. The only motion longer than base.
  moment: 700,
  // How long a task completed in the Open view stays before it leaves. A
  // pause, not an animation, so reduced motion keeps it.
  linger: 800,
}

// Decelerating: fast start, soft landing. Used for enter and hover alike.
const bezier = [0.2, 0, 0, 1] as const
export const easing = `cubic-bezier(${bezier.join(', ')})`

export const offsets = {
  // Pixels an arriving row or card rises.
  enter: 4,
  // Pixels the points float travels.
  rise: 16,
  // The scale the streak flame swells to, a factor rather than pixels.
  pop: 1.25,
}

// The same tokens for the motion library, which counts in seconds.
export const transitions = {
  base: { duration: durations.base / 1000, ease: bezier },
  moment: { duration: durations.moment / 1000, ease: bezier },
} satisfies Record<string, Transition>
