import { Center, Loader } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router'
import { LandingScreen } from '../landing/LandingScreen'
import { useCurrentUser, useEndRefusedSession } from './session'

// Wraps every route under the app shell. Until Clerk and then /me have
// answered it shows a loader rather than flashing the login page; once the
// answer is "signed out":
// - A visitor to the root path / sees the public LandingScreen.
// - A visitor attempting to access any protected route is redirected to
//   /login, with redirect_url, which Clerk's SignIn returns to afterwards.
// A signed-in user renders the requested route inside the shell.
export function RequireAuth() {
  const { data: user, isPending } = useCurrentUser()
  const ending = useEndRefusedSession(user)
  const location = useLocation()

  if (isPending || ending) {
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
    const back = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect_url=${back}`} replace />
  }

  return <Outlet />
}
