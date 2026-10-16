import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import '@mantine/spotlight/styles.css'
import 'mantine-datatable/styles.css'
import '@fontsource-variable/inter'
import './theme/global.css'
import { ClerkProvider } from '@clerk/react'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'
import { LazyMotion, MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { clerkAppearance } from './auth/clerkAppearance'
import { queryClient } from './queryClient'
import { router } from './router'
import { PaletteProvider } from './theme'
import { durations, transitions } from './theme/motion'

// LazyMotion fetches motion's animation features in their own chunk after
// the first render, so the main chunk carries only the lightweight m
// components. strict throws in development if a full motion.* component,
// which bundles every feature, is rendered anyway.
const loadMotionFeatures = () => import('./theme/motionFeatures').then((mod) => mod.domMax)

// ClerkProvider holds the session (ADR-0015) and sits inside the Mantine
// provider so its components inherit the palette's CSS variables.
//
// MotionConfig gives every motion element the base step by default and, under
// the OS reduced-motion setting, drops transform and layout animation.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user" transition={transitions.base}>
        <PaletteProvider>
          <ModalsProvider>
            <Notifications transitionDuration={durations.base} />
            <ClerkProvider
              publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
              appearance={clerkAppearance}
              signInUrl="/login"
              signUpUrl="/register"
              afterSignOutUrl="/login"
              // Clerk's redirects go through the app's router instead of
              // reloading the page.
              routerPush={(to) => router.navigate(to)}
              routerReplace={(to) => router.navigate(to, { replace: true })}
            >
              <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
              </QueryClientProvider>
            </ClerkProvider>
          </ModalsProvider>
        </PaletteProvider>
      </MotionConfig>
    </LazyMotion>
  </StrictMode>,
)
