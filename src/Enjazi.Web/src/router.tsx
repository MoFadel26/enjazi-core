import { Center, Loader } from '@mantine/core'
import { createBrowserRouter } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { RequireRole } from './auth/RequireRole'
import { DashboardScreen } from './dashboard/DashboardScreen'
import { AppLayout } from './layout/AppLayout'
import { RoomScreen } from './rooms/RoomScreen'
import { RoomsScreen } from './rooms/RoomsScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from './screens/RegisterScreen'
import { SettingsScreen } from './settings/SettingsScreen'
import { TasksScreen } from './tasks/TasksScreen'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginScreen /> },
  { path: '/register', element: <RegisterScreen /> },
  {
    // Everything below needs a signed-in user and renders inside the shell.
    element: <RequireAuth />,
    // Shown while a lazy route's code is still loading on the first visit.
    hydrateFallbackElement: (
      <Center h="100vh">
        <Loader />
      </Center>
    ),
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardScreen /> },
          { path: 'tasks', element: <TasksScreen /> },
          {
            // FullCalendar is the largest dependency and most visits never
            // open it, so this route's code is fetched on first visit.
            path: 'calendar',
            lazy: async () => ({ Component: (await import('./calendar/CalendarScreen')).CalendarScreen }),
          },
          { path: 'rooms', element: <RoomsScreen /> },
          { path: 'rooms/:id', element: <RoomScreen /> },
          { path: 'settings', element: <SettingsScreen /> },
          {
            // Protected by nesting, like RequireAuth: an admin route is one
            // that lives under this element.
            element: <RequireRole role="Admin" />,
            children: [
              {
                path: 'admin/users',
                lazy: async () => ({ Component: (await import('./admin/AdminUsersScreen')).AdminUsersScreen }),
              },
            ],
          },
        ],
      },
    ],
  },
])
