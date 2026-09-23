import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useCurrentUser } from './session'

// Wraps every route that needs a signed-in user. Until /me has answered it
// shows a loader rather than flashing the login page; once it answers null,
// it redirects and remembers where the user was going.
export function RequireAuth() {
  const { data: user, isPending } = useCurrentUser()
  const location = useLocation()

  if (isPending) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
