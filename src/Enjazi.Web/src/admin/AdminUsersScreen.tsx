import { Alert, Badge, Box, Group, Text, TextInput } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconSearch } from '@tabler/icons-react'
import { DataTable } from 'mantine-datatable'
import { useState } from 'react'
import { describeError } from '../api/errors'
import { formatDate } from '../lib/dates'
import { PageHeader } from '../ui/PageHeader'
import { EditUserModal } from './EditUserModal'
import { pageSize, useAdminUsers, type AdminUser } from './queries'

export function AdminUsersScreen() {
  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebouncedValue(search, 300)
  const [page, setPage] = useState(1)
  const { data, isFetching, error } = useAdminUsers(debouncedSearch, page)
  const [editing, setEditing] = useState<AdminUser | null>(null)

  return (
    <>
      <PageHeader
        title="Users"
        actions={
          <TextInput
            leftSection={<IconSearch size={16} stroke={1.75} />}
            placeholder="Search by name or email"
            aria-label="Search users"
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value)
              setPage(1)
            }}
            w={280}
          />
        }
      />

      {error && (
        <Alert color="red" mb="md">
          {describeError(error)}
        </Alert>
      )}

      <DataTable<AdminUser>
        withTableBorder
        borderRadius="lg"
        highlightOnHover
        minHeight={180}
        fetching={isFetching}
        idAccessor="id"
        records={data?.items ?? []}
        columns={[
          { accessor: 'displayName', title: 'Name' },
          { accessor: 'email', title: 'Email' },
          {
            accessor: 'roles',
            title: 'Roles',
            render: (user) =>
              user.roles.map((role) => (
                <Badge key={role} mr={4}>
                  {role}
                </Badge>
              )),
          },
          {
            accessor: 'disabled',
            title: 'Status',
            render: (user) => (
              <Group gap="xs" wrap="nowrap">
                <Box component="span" w={6} h={6} bdrs="50%" bg={user.disabled ? 'red.6' : 'green.6'} />
                <Text>{user.disabled ? 'Disabled' : 'Active'}</Text>
              </Group>
            ),
          },
          { accessor: 'createdAt', title: 'Joined', render: (user) => formatDate(user.createdAt) },
        ]}
        totalRecords={Number(data?.total ?? 0)}
        recordsPerPage={pageSize}
        page={page}
        onPageChange={setPage}
        onRowClick={({ record }) => setEditing(record)}
        noRecordsText="No users match."
      />

      {editing && <EditUserModal key={editing.id} user={editing} onClose={() => setEditing(null)} />}
    </>
  )
}
