import { Alert, Button, PasswordInput, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useNavigate } from 'react-router'
import { useRegister } from '../auth/session'
import { AuthCard } from './AuthCard'

export function RegisterScreen() {
  const register = useRegister()
  const navigate = useNavigate()

  const form = useForm({
    initialValues: { displayName: '', email: '', password: '' },
    validate: {
      displayName: (value) => (value.trim().length > 0 ? null : 'Enter a name'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Enter an email address'),
      // Matches the API's policy: length only, twelve characters. ADR-0006.
      password: (value) => (value.length >= 12 ? null : 'Use at least 12 characters'),
    },
  })

  return (
    <AuthCard
      title="Register"
      footer={{ text: 'Already have an account?', linkText: 'Log in', to: '/login' }}
    >
      <form
        onSubmit={form.onSubmit((values) =>
          register.mutate(values, { onSuccess: () => navigate('/', { replace: true }) }),
        )}
      >
        <Stack>
          <TextInput label="Name" autoComplete="name" {...form.getInputProps('displayName')} />
          <TextInput label="Email" type="email" autoComplete="email" {...form.getInputProps('email')} />
          <PasswordInput label="Password" autoComplete="new-password" {...form.getInputProps('password')} />
          {register.error && <Alert color="red">{register.error.message}</Alert>}
          <Button type="submit" loading={register.isPending}>
            Create account
          </Button>
        </Stack>
      </form>
    </AuthCard>
  )
}
