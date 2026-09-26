import { Group, Paper, Skeleton, Stack } from '@mantine/core'
import type { ReactNode } from 'react'

// SettingsForm's three sections before the settings arrive, each bar as tall
// as the line it stands for, so nothing moves when the form replaces them.
export function SettingsSkeleton() {
  return (
    <Stack maw={560} role="progressbar" aria-label="Loading settings">
      <SectionSkeleton>
        <SelectSkeleton labelWidth={48} />
      </SectionSkeleton>
      <SectionSkeleton>
        <SelectSkeleton labelWidth={72} />
      </SectionSkeleton>
      <SectionSkeleton>
        <SwitchSkeleton labelWidth={160} />
        <SwitchSkeleton labelWidth={156} />
        <SwitchSkeleton labelWidth={112} />
      </SectionSkeleton>
    </Stack>
  )
}

// The Paper, the h3 title and the sm sentence under it.
function SectionSkeleton({ children }: { children: ReactNode }) {
  return (
    <Paper p="lg">
      <Stack gap="md">
        <div>
          <Skeleton height={21} width="30%" />
          <Skeleton height={18} width="70%" mt={4} />
        </div>
        {children}
      </Stack>
    </Paper>
  )
}

// The label is sm text like the description, but Input.Wrapper sets it in a
// 21.5px line; the 36px input sits right under it.
function SelectSkeleton({ labelWidth }: { labelWidth: number }) {
  return (
    <div>
      <Skeleton height={18} width={labelWidth} mb={3.5} />
      <Skeleton height={36} />
    </div>
  )
}

// Mantine's sm Switch: a 38 by 20 track, the label spacing sm to its right.
function SwitchSkeleton({ labelWidth }: { labelWidth: number }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <Skeleton height={20} width={38} radius="xl" />
      <Skeleton height={18} width={labelWidth} />
    </Group>
  )
}
