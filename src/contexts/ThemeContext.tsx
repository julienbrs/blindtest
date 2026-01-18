'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'

type Theme = 'festive' | 'dark'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  toggle: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const THEME_STORAGE_KEY = 'blindtest_theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('festive')
  const [hasMounted, setHasMounted] = useState(false)

  // Load theme from localStorage on mount
  // This is a legitimate use case for setState in useEffect - hydrating state from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'festive' || savedTheme === 'dark') {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- Hydrating from localStorage on mount is standard */
      setThemeState(savedTheme)
    }
    setHasMounted(true)
  }, [])

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    }
  }, [theme, hasMounted])

  const toggle = useCallback(() => {
    setThemeState((prev) => (prev === 'festive' ? 'dark' : 'festive'))
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggle,
      setTheme,
    }),
    [theme, toggle, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
