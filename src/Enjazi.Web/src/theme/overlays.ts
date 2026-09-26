import { Menu, Modal, Notification, Popover, Tooltip, type MantineThemeComponents, type TransitionOverride } from '@mantine/core'
import { Spotlight } from '@mantine/spotlight'
import { durations, easing } from './motion'
import { hairline, raised } from './refs'

// Enter and leave run on Mantine's Transition, which theme.respectReducedMotion
// zeroes under the OS setting.
const pop: TransitionOverride = { transition: 'pop', duration: durations.base, timingFunction: easing }
const overlay = { backgroundOpacity: 0.55 }

// The raised layers, on --enjazi-surface-raised, and how they enter and
// leave. docs/design.md, "Components" and "Motion".
export const overlays: MantineThemeComponents = {
  // The overlay reads the same transitionProps and fades.
  Modal: Modal.extend({
    defaultProps: { radius: 'lg', shadow: 'md', overlayProps: overlay, transitionProps: pop },
    styles: (theme) => ({
      // The content is a Paper, so it would otherwise carry Paper's border.
      content: { backgroundColor: raised, border: 'none' },
      header: { backgroundColor: raised },
      title: { fontWeight: 600, fontSize: theme.fontSizes.lg },
    }),
  }),
  // Comboboxes pass their own zero-duration transition to Popover, so Select
  // and the time zone list stay instant.
  Popover: Popover.extend({
    defaultProps: { radius: 'md', shadow: 'md', transitionProps: pop },
    styles: { dropdown: { backgroundColor: raised } },
  }),
  Menu: Menu.extend({
    defaultProps: { radius: 'md', shadow: 'md', transitionProps: pop },
    styles: (theme) => ({ dropdown: { backgroundColor: raised }, item: { borderRadius: theme.radius.sm } }),
  }),
  // Notification enters and leaves inside the Notifications container, whose
  // duration main.tsx sets. Mantine fixes the easing inline, and drops the
  // duration to 1ms under reduced motion because theme.respectReducedMotion
  // is on.
  Notification: Notification.extend({
    defaultProps: { radius: 'md' },
    styles: { root: { backgroundColor: raised } },
  }),
  Tooltip: Tooltip.extend({
    defaultProps: { radius: 'md', transitionProps: { transition: 'fade', duration: durations.fast, timingFunction: easing } },
    styles: {
      tooltip: {
        backgroundColor: raised,
        color: 'var(--mantine-color-text)',
        boxShadow: 'var(--mantine-shadow-md)',
      },
    },
  }),
  // Spotlight renders a Modal, so radius and shadow come from the Modal entry.
  // Its own defaults replace Modal's overlay and transition, and its styles
  // are keyed Spotlight, so those are set here. Hover and selection colours
  // and the group labels are in global.css.
  Spotlight: Spotlight.extend({
    defaultProps: { overlayProps: overlay, transitionProps: pop },
    styles: {
      content: { backgroundColor: raised, border: 'none' },
      search: { height: '48px', minHeight: '48px' },
      // The hairline under the search is the list's top border. The empty
      // message takes the list's place, so it draws one too.
      actionsList: { borderColor: hairline },
      empty: { borderTop: `1px solid ${hairline}` },
    },
  }),
}
