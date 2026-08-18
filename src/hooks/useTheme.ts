import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

/** Matches --fmb-bg for each theme; iOS tints the status bar area with this. */
const CHROME: Record<Theme, string> = {
  dark: '#0B0B0D',
  light: '#FAFAFA',
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('bus-tracker-theme')
    if (stored === 'light' || stored === 'dark') return stored
    return 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    localStorage.setItem('bus-tracker-theme', theme)

    // The theme is a user choice, so it cannot be expressed with a
    // prefers-color-scheme media attribute — the meta has to be written.
    // Without this the installed app gets a status bar from the wrong theme.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', CHROME[theme])
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, isDark: theme === 'dark', toggle }
}
