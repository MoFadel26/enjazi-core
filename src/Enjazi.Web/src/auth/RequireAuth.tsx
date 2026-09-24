import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'
import { LandingScreen } from '../landing/LandingScreen'
import { useCurrentUser } from './session'

// Wraps every route under the app shell. Until /me has answered it shows a loader
// rather than flashing the login page; once it answers null:
// - A visitor to the root path / sees the public LandingScreen.
// - A visitor attempting to access any protected route is redirected to /login.
// A signed-in user renders the requested route inside the shell.
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
    if (location.pathname === '/') {
      return <LandingScreen />
    }
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
