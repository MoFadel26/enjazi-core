import { Alert, Badge, Group, TextInput, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { DataTable } from 'mantine-datatable'
import { useState } from 'react'
import { describeError } from '../api/errors'
import { formatDate } from '../lib/dates'
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
      <Group justify="space-between" mb="md">
        <Title order={2}>Users</Title>
        <TextInput
          placeholder="Search by name or email"
          aria-label="Search users"
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value)
            setPage(1)
          }}
          w={280}
        />
      </Group>

      {error && (
        <Alert color="red" mb="md">
          {describeError(error)}
        </Alert>
      )}

      <DataTable<AdminUser>
        withTableBorder
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
                <Badge key={role} variant="light" mr={4}>
                  {role}
                </Badge>
              )),
          },
          {
            accessor: 'disabled',
            title: 'Status',
            render: (user) => (
              <Badge variant="light" color={user.disabled ? 'red' : 'green'}>
                {user.disabled ? 'Disabled' : 'Active'}
              </Badge>
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
