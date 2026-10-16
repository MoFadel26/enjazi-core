import { SignIn } from '@clerk/react'
import { AuthCard } from './AuthCard'

// Clerk's sign-in, routed under /login/* for its own steps (second factor,
// password reset). It returns to ?redirect_url= when RequireAuth set one.
export function LoginScreen() {
  return (
    <AuthCard>
      <SignIn routing="path" path="/login" signUpUrl="/register" fallbackRedirectUrl="/" />
    </AuthCard>
  )
}
