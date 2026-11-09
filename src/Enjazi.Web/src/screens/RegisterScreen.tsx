import { SignUp } from '@clerk/react'
import { AuthCard } from './AuthCard'

// Clerk's sign-up, routed under /register/* for its own steps (email code).
export function RegisterScreen() {
  return (
    <AuthCard>
      <SignUp routing="path" path="/register" signInUrl="/login" fallbackRedirectUrl="/" />
    </AuthCard>
  )
}
