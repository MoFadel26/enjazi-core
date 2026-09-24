import {
  ActionIcon,
  Alert,
  Anchor,
  AppShell,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Input,
  Loader,
  Menu,
  Modal,
  NavLink,
  Notification,
  Paper,
  Popover,
  SegmentedControl,
  Switch,
  Table,
  Title,
  Tooltip,
  type MantineThemeComponents,
  type TitleOrder,
} from '@mantine/core'

const raised = 'var(--enjazi-surface-raised)'
const hairline = 'var(--mantine-color-default-border)'
const dimmed = 'var(--mantine-color-dimmed)'

// Mantine's heading sizes carry no tracking field, so Title adds it by order.
const tracking: Record<TitleOrder, string> = { 1: '-0.5px', 2: '-0.4px', 3: '-0.2px', 4: '0', 5: '0', 6: '0' }

// The Components table in docs/design.md, one entry per row. defaultProps
// where a prop exists; styles or vars only where it does not.
export const components: MantineThemeComponents = {
  Button: Button.extend({
    defaultProps: { size: 'sm' },
    vars: (theme) => ({ root: { '--button-fz': theme.fontSizes.md, '--button-padding-x': '14px' } }),
  }),
  ActionIcon: ActionIcon.extend({ defaultProps: { variant: 'subtle', color: 'gray', size: 'md' } }),
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
  AppShell: AppShell.extend({
    vars: () => ({ root: { ...({ '--app-shell-border-color': hairline } as Record<string, string>) } }),
  }),
  Card: Card.extend({ defaultProps: { withBorder: true, radius: 'lg', padding: 'lg' } }),
  Modal: Modal.extend({
    defaultProps: { radius: 'lg', shadow: 'md', overlayProps: { backgroundOpacity: 0.55 } },
    styles: (theme) => ({
      // The content is a Paper, so it would otherwise carry Paper's border.
      content: { backgroundColor: raised, border: 'none' },
      header: { backgroundColor: raised },
      title: { fontWeight: 600, fontSize: theme.fontSizes.lg },
    }),
  }),
  Popover: Popover.extend({
    defaultProps: { radius: 'md', shadow: 'md' },
    styles: { dropdown: { backgroundColor: raised } },
  }),
  Menu: Menu.extend({
    defaultProps: { radius: 'md', shadow: 'md' },
    styles: (theme) => ({ dropdown: { backgroundColor: raised }, item: { borderRadius: theme.radius.sm } }),
  }),
  Notification: Notification.extend({
    defaultProps: { radius: 'md' },
    styles: { root: { backgroundColor: raised } },
  }),
  Tooltip: Tooltip.extend({
    defaultProps: { radius: 'md' },
    styles: {
      tooltip: {
        backgroundColor: raised,
        color: 'var(--mantine-color-text)',
        boxShadow: 'var(--mantine-shadow-md)',
      },
    },
  }),
  Badge: Badge.extend({
    defaultProps: { variant: 'light', size: 'sm', radius: 'xl' },
    styles: { root: { fontWeight: 500, textTransform: 'none' } },
  }),
  SegmentedControl: SegmentedControl.extend({
    defaultProps: { radius: 'xl' },
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
  NavLink: NavLink.extend({
    vars: () => ({
      root: { '--nl-bg': 'var(--enjazi-surface-3)', '--nl-hover': 'var(--enjazi-surface-3)', '--nl-color': 'var(--mantine-color-text)' },
      children: {},
    }),
    // Inactive links are quiet; the active one keeps ink text and a lavender icon.
    styles: (theme, props) => ({
      root: { borderRadius: theme.radius.md, color: props.active ? undefined : dimmed },
      section: { color: props.active ? 'var(--mantine-primary-color-filled)' : dimmed },
      label: { fontWeight: props.active ? 500 : 400, fontSize: theme.fontSizes.md },
    }),
  }),
  Table: Table.extend({
    defaultProps: { verticalSpacing: 'sm', highlightOnHover: true },
    vars: () => ({ table: { '--table-highlight-on-hover-color': 'var(--enjazi-surface-2)' } }),
  }),
  Checkbox: Checkbox.extend({ defaultProps: { radius: 'sm', color: 'lavender' } }),
  Switch: Switch.extend({ defaultProps: { color: 'lavender' } }),
  Alert: Alert.extend({ defaultProps: { variant: 'light', radius: 'md' } }),
  Anchor: Anchor.extend({ defaultProps: { underline: 'hover' } }),
  Loader: Loader.extend({ defaultProps: { color: 'lavender' } }),
  Title: Title.extend({
    styles: (_theme, props) => ({ root: { letterSpacing: tracking[props.order ?? 1] } }),
  }),
}
