import { Anchor, Box, Card, Divider, Stack, Title } from '@mantine/core'
import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Eyebrow } from './Eyebrow'

type Props = {
  label: string
  // Rendered inside the h2; pass a span-based group to sit an icon next to it.
  value: ReactNode
  // Each row is separated from the next by a hairline.
  rows?: ReactNode[]
  footer?: { to: string; label: string }
}

// The dashboard tile: eyebrow, big number, detail rows, one link.
export function StatCard({ label, value, rows, footer }: Props) {
  return (
    <Card h="100%">
      <Stack gap="xs" h="100%">
        <Eyebrow>{label}</Eyebrow>
        <Title order={2} style={{ fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Title>
        {rows && rows.length > 0 && (
          <Stack gap={0}>
            {rows.map((row, index) => (
              <Fragment key={index}>
                {index > 0 && <Divider />}
                <Box py="xs">{row}</Box>
              </Fragment>
            ))}
          </Stack>
        )}
        {footer && (
          <Anchor component={Link} to={footer.to} size="sm" mt="auto">
            {footer.label}
          </Anchor>
        )}
      </Stack>
    </Card>
  )
}
