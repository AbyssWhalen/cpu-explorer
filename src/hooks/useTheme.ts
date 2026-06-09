import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'cpu-explorer-theme'

/** Read the theme the anti-FOUC script already applied to <html>. */
function getInitialTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'light' ? 'light' : 'dark'
}

/**
 * Theme state backed by localStorage and the `data-theme` attribute on <html>.
 * Initial value comes from the inline boot script in index.html, so this hook
 * never causes a flash on first paint.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage unavailable (private mode / blocked) — theme still applies for the session.
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return { theme, toggle }
}
