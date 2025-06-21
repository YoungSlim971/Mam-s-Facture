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
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const root = document.documentElement
    const applyTheme = () => {
      root.classList.remove('theme-sunset', 'theme-light', 'theme-dark', 'dark')

      if (theme === 'sunset') {
        root.classList.add('theme-sunset')
        return
      }

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      if (theme === 'dark' || (theme === 'system' && prefersDark)) {
        root.classList.add('theme-dark', 'dark')
      } else {
        root.classList.add('theme-light')
      }
    }

    applyTheme()

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', applyTheme)
      return () => media.removeEventListener('change', applyTheme)
    }
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
