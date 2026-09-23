import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useNavigate } from 'react-router'
import { useLogin } from '../auth/session'
import { useReturnTo } from '../auth/useReturnTo'
import { AuthCard } from './AuthCard'

export function LoginScreen() {
  const login = useLogin()
  const navigate = useNavigate()
  const returnTo = useReturnTo()

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Enter an email address'),
      password: (value) => (value.length > 0 ? null : 'Enter your password'),
    },
  })

  return (
    <AuthCard
      title="Log in"
      footer={{ text: 'No account?', linkText: 'Register', to: '/register' }}
    >
      <form
        onSubmit={form.onSubmit((values) =>
          login.mutate(values, { onSuccess: () => navigate(returnTo, { replace: true }) }),
        )}
      >
        <Stack>
          <TextInput label="Email" type="email" autoComplete="email" {...form.getInputProps('email')} />
          <PasswordInput label="Password" autoComplete="current-password" {...form.getInputProps('password')} />
          {login.error && <Alert color="red">{login.error.message}</Alert>}
          <Button type="submit" loading={login.isPending}>
            Log in
          </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
