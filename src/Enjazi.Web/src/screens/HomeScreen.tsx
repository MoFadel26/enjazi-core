import { Text, Title } from '@mantine/core'
import { useCurrentUser } from '../auth/session'

export function HomeScreen() {
  const { data: user } = useCurrentUser()

  return (
    <>
      <Title order={2}>Dashboard</Title>
      <Text mt="sm">Signed in as {user?.email}.</Text>
    </>
  )
}
