import { flushSync } from 'react-dom'

// A colour scheme or palette change repaints every surface at once. Inside a
// view transition the browser takes a picture of the page before and after
// the change and cross-fades the two (global.css sets the duration), so the
// switch is one fade instead of a jump. flushSync makes React commit inside
// the callback, so the "after" picture has the new colours. Browsers without
// the API switch at once. A fade is not movement, so reduced motion keeps it.
export function changeTheme(update: () => void) {
  if (typeof document.startViewTransition !== 'function') {
    update()
    return
  }
  document.startViewTransition(() => flushSync(update))
}
