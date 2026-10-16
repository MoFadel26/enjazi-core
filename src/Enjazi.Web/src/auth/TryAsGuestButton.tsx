import { Button, type ButtonProps } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { UserCircleDashedIcon } from '@phosphor-icons/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { fetchClient } from '../api/client'
import { setGuestSession, useGuestSession } from '../api/guestSession'
import { Icon } from '../ui/Icon'
import { currentUserKey } from './keys'

// Starts a guest session (ADR-0017): the API creates a temporary account
// with sample data and returns its token. Hidden once a guest session exists.
export function TryAsGuestButton(props: ButtonProps) {
  const guest = useGuestSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const start = useMutation({
    mutationFn: async () => {
      const { data, response } = await fetchClient.POST('/api/auth/guest', {
        body: { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      })
      if (data === undefined) throw new Error(failure(response.status))
      return data
    },
    onSuccess: (session) => {
      queryClient.removeQueries({ queryKey: currentUserKey })
      setGuestSession(session)
      void navigate('/', { replace: true })
    },
    onError: (error) => notifications.show({ color: 'red', message: error.message }),
  })

  if (guest) return null

  return (
    <Button
      variant="default"
      leftSection={<Icon icon={UserCircleDashedIcon} />}
      loading={start.isPending}
      onClick={() => start.mutate()}
      {...props}
    >
      Try as guest
    </Button>
  )
}

function failure(status: number) {
  if (status === 429) return 'Too many guest sessions from your network. Try again in an hour.'
  if (status === 503) return 'Guest mode is not available right now.'
  return `Could not start a guest session (${status}).`
}
