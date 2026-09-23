import { useLocation } from 'react-router'

// Where to go after signing in: the path RequireAuth redirected from, or /.
export function useReturnTo(): string {
  const { state } = useLocation()
  const from = typeof state === 'object' && state !== null && 'from' in state ? state.from : undefined
  return typeof from === 'string' ? from : '/'
}
