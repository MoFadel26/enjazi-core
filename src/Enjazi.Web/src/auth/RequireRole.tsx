import { Navigate, Outlet } from 'react-router'
import { useCurrentUser } from './session'

// Nested under RequireAuth, so the user is known by the time this renders.
// Sends anyone without the role home; the API refuses them anyway, this
// just avoids showing a screen that cannot load.
export function RequireRole({ role }: { role: string }) {
  const { data: user } = useCurrentUser()
  if (!user?.roles.includes(role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
