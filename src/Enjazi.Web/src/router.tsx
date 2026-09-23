import { createBrowserRouter } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './layout/AppLayout'
import { HomeScreen } from './screens/HomeScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from './screens/RegisterScreen'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginScreen /> },
  { path: '/register', element: <RegisterScreen /> },
  {
    // Everything below needs a signed-in user and renders inside the shell.
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [{ index: true, element: <HomeScreen /> }],
      },
    ],
  },
])
