import React, { useState, useEffect, createContext, useContext } from 'react'

export type Theme = 'sunset' | 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('sunset')

  useEffect(() => {
    const cls = `theme-${theme}`
    document.documentElement.classList.remove('theme-sunset', 'theme-light', 'theme-dark')
    document.documentElement.classList.add(cls)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'sunset' ? 'light' : prev === 'light' ? 'dark' : 'sunset'))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
