import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

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
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return { theme, isDark: theme === 'dark', toggle }
}
