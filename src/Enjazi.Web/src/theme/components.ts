import {
  ActionIcon,
  Alert,
  Anchor,
  AppShell,
  Badge,
  Burger,
  Button,
  Card,
  Checkbox,
  Divider,
  FloatingIndicator,
  Input,
  Kbd,
  Loader,
  NavLink,
  Paper,
  SegmentedControl,
  Skeleton,
  Switch,
  Table,
  Title,
  type MantineThemeComponents,
  type TitleOrder,
} from '@mantine/core'
import { durations, easing } from './motion'
import { overlays } from './overlays'
import { dimmed, hairline, raised } from './refs'

// Mantine's heading sizes carry no tracking field, so Title adds it by order.
const tracking: Record<TitleOrder, string> = { 1: '-0.5px', 2: '-0.4px', 3: '-0.2px', 4: '0', 5: '0', 6: '0' }

// Mantine's own CSS transitions, retimed to the fast step.
const fast = { transitionDuration: 'var(--enjazi-duration-fast)', transitionTimingFunction: 'var(--enjazi-ease)' }
// Hover and press on controls and rows. Colour only: the press offset stays
// instant, and movement belongs to the motion library.
const colour = { transitionProperty: 'background-color, border-color, color', ...fast }

// The Components table in docs/design.md, one entry per row. defaultProps
// where a prop exists; styles or vars only where it does not. Raised layers
// that enter and leave (Modal, Popover, Menu, Tooltip, Spotlight) are in
// overlays.ts.
export const components: MantineThemeComponents = {
  Button: Button.extend({
    defaultProps: { size: 'sm' },
    vars: (theme) => ({ root: { '--button-fz': theme.fontSizes.md, '--button-padding-x': '14px' } }),
    styles: { root: colour },
  }),
  ActionIcon: ActionIcon.extend({
    defaultProps: { variant: 'subtle', color: 'gray', size: 'md' },
    styles: { root: colour },
  }),
  Input: Input.extend({
    defaultProps: { size: 'sm' },
    // Mantine derives the horizontal padding from the height (12px at sm).
    vars: () => ({ wrapper: { ...({ '--input-padding': '14px' } as Record<string, string>) } }),
  }),
  // Mantine's light border for Paper, Divider and AppShell is gray-3; the
  // hairline is gray-4, which is what --mantine-color-default-border holds.
  Paper: Paper.extend({
    defaultProps: { withBorder: true, radius: 'lg' },
    vars: () => ({ root: { ...({ '--paper-border-color': hairline } as Record<string, string>) } }),
    styles: { root: { backgroundColor: 'var(--enjazi-surface-1)' } },
  }),
  Divider: Divider.extend({ vars: () => ({ root: { '--divider-color': hairline } }) }),
  // The mobile navbar slides and the header and main shift with it. The
  // slide is plain CSS, not Mantine's Transition, so each animated part opts
  // into Mantine's reduced-motion rule through the attribute.
  AppShell: AppShell.extend({
    defaultProps: {
      transitionDuration: durations.base,
      transitionTimingFunction: easing,
      attributes: {
        navbar: { 'data-reduce-motion': true },
        header: { 'data-reduce-motion': true },
        main: { 'data-reduce-motion': true },
      },
    },
    vars: () => ({ root: { ...({ '--app-shell-border-color': hairline } as Record<string, string>) } }),
  }),
  // The burger turns into a cross as the navbar slides, so it takes the same
  // step. It opts into the reduced-motion rule by itself.
  Burger: Burger.extend({ defaultProps: { transitionDuration: durations.base, transitionTimingFunction: easing } }),
  Card: Card.extend({ defaultProps: { withBorder: true, radius: 'lg', padding: 'lg' } }),
  ...overlays,
  Badge: Badge.extend({
    defaultProps: { variant: 'light', size: 'sm', radius: 'xl' },
    styles: { root: { fontWeight: 500, textTransform: 'none' } },
  }),
  SegmentedControl: SegmentedControl.extend({
    // The duration reaches the indicator; the timing function only the label
    // colour, as the indicator is a FloatingIndicator and eases by that entry.
    defaultProps: { radius: 'xl', transitionDuration: durations.base, transitionTimingFunction: easing },
    vars: (theme) => ({
      root: {
        '--sc-color': raised,
        '--sc-shadow': theme.shadows.xs,
        // Read by the css for the active label but absent from the vars type.
        ...({ '--sc-label-color': 'var(--mantine-color-text)' } as Record<string, string>),
      },
    }),
    styles: { root: { backgroundColor: 'var(--enjazi-surface-2)' } },
  }),
  // The active background is the sidebar's FloatingIndicator, so the link
  // paints none of its own and sits above the indicator. The inactive hover
  // is set in global.css, where Mantine fixes it.
  NavLink: NavLink.extend({
    vars: () => ({
      root: { '--nl-bg': 'transparent', '--nl-hover': 'var(--enjazi-surface-3)', '--nl-color': 'var(--mantine-color-text)' },
      children: {},
    }),
    // Inactive links are quiet; the active one keeps ink text and a lavender icon.
    styles: (theme, props) => ({
      root: { borderRadius: theme.radius.md, color: props.active ? undefined : dimmed, position: 'relative', zIndex: 1, ...colour },
      section: { color: props.active ? 'var(--mantine-primary-color-filled)' : dimmed },
      label: { fontWeight: props.active ? 500 : 400, fontSize: theme.fontSizes.md },
    }),
  }),
  // The sidebar's nav marker. SegmentedControl renders one inside and passes
  // its own duration, so only the easing reaches both. Its look is in
  // global.css: styles here are inline and would repaint the control's.
  FloatingIndicator: FloatingIndicator.extend({
    defaultProps: { transitionDuration: durations.base },
    styles: { root: { transitionTimingFunction: easing } },
  }),
  Table: Table.extend({
    defaultProps: { verticalSpacing: 'sm', highlightOnHover: true },
    vars: () => ({ table: { '--table-highlight-on-hover-color': 'var(--enjazi-surface-2)' } }),
    styles: { tr: colour },
  }),
  // The tick slides as it appears, and Checkbox does not opt into Mantine's
  // reduced-motion rule by itself; the attribute does that for the icon.
  Checkbox: Checkbox.extend({
    defaultProps: { radius: 'sm', color: 'lavender', attributes: { icon: { 'data-reduce-motion': true } } },
    styles: { input: fast, icon: fast },
  }),
  Switch: Switch.extend({ defaultProps: { color: 'lavender' } }),
  Alert: Alert.extend({ defaultProps: { variant: 'light', radius: 'md' } }),
  Anchor: Anchor.extend({ defaultProps: { underline: 'hover' } }),
  Loader: Loader.extend({ defaultProps: { color: 'lavender' } }),
  // The pulse colour is on ::after, so it is set in global.css.
  Skeleton: Skeleton.extend({ defaultProps: { radius: 'sm' } }),
  // A quiet key: hairline all round instead of Mantine's raised bottom edge.
  Kbd: Kbd.extend({
    defaultProps: { size: 'xs' },
    styles: { root: { backgroundColor: 'var(--enjazi-surface-2)', border: `1px solid ${hairline}`, color: dimmed, fontWeight: 500 } },
  }),
  Title: Title.extend({
    styles: (_theme, props) => ({ root: { letterSpacing: tracking[props.order ?? 1] } }),
  }),
}
