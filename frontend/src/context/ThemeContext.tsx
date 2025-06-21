import React, { useState, useEffect, createContext, useContext } from 'react'

// The application supports three modes:
//  - "sunset"  : a custom colorful theme
//  - "dark"    : a dark theme
//  - "system"  : follows the OS preference (light or dark)
export type Theme = 'sunset' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const getSystem = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    const stored = localStorage.getItem('theme') as Theme | null
    return stored ?? 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    const applyTheme = () => {
      root.classList.remove('light', 'dark', 'sunset', 'system')

      if (theme === 'sunset') {
        root.classList.add('sunset')
        return
      }

      if (theme === 'dark') {
        root.classList.add('dark')
      } else if (theme === 'system') {
        root.classList.add('system')
      } else {
        root.classList.add('light')
      }
    }

    applyTheme()
    localStorage.setItem('theme', theme)

    // no system media listener
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'sunset' ? 'dark' : prev === 'dark' ? 'system' : 'sunset'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
