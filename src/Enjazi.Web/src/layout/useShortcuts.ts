import { spotlight } from '@mantine/spotlight'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { tinykeys, type KeybindingsMap } from 'tinykeys'
import { adminLinks, links, newTask } from './destinations'

// Input types a letter key does not type into.
const keyless = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'])

function isTextEntry(target: EventTarget | null) {
  if (target instanceof HTMLInputElement) return !keyless.has(target.type)
  return (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

// Replaces tinykeys' default filter, which skips every <input>, checkboxes
// included. On top of text entry: a held key repeats, an IME is mid-word,
// and a key pressed in a modal or the palette belongs to it.
function ignore(event: KeyboardEvent) {
  return (
    event.repeat ||
    event.isComposing ||
    isTextEntry(event.target) ||
    (event.target instanceof Element && event.target.closest('[role="dialog"]') !== null)
  )
}

// The app's shortcuts: N, the G sequences and mod+K for the palette. Esc
// belongs to Mantine's modals.
export function useShortcuts(isAdmin: boolean) {
  const navigate = useNavigate()

  useEffect(() => {
    const destinations = [newTask, ...links, ...(isAdmin ? adminLinks : [])]
    const bindings: KeybindingsMap = Object.fromEntries(
      destinations.map(({ to, shortcut }) => [shortcut, () => navigate(to)]),
    )
    bindings['$mod+k'] = (event) => {
      // Ctrl+K would also focus the browser's search bar.
      event.preventDefault()
      spotlight.open()
    }
    // One subscription per binding. tinykeys checks a map in order and stops
    // at the first binding that fires, leaving the later ones half-matched:
    // G T then G C within a second went nowhere.
    const unsubscribes = Object.entries(bindings).map(([keys, handler]) =>
      tinykeys(window, { [keys]: handler }, { ignore }),
    )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [isAdmin, navigate])
}
