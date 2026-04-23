import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyTheme } from '../theme'
import { ThemeContext } from './theme-context'

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme_mode') || 'dark')

  useEffect(() => {
    applyTheme(mode)
    localStorage.setItem('theme_mode', mode)
  }, [mode])

  const setThemeMode = useCallback((nextMode) => {
    const normalized = nextMode === 'light' ? 'light' : 'dark'
    localStorage.setItem('theme_mode', normalized)
    applyTheme(normalized)
    setMode(normalized)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setThemeMode(next)
    // Recarga para re-hidratar componentes con estilos definidos a nivel de modulo.
    window.location.reload()
  }, [mode, setThemeMode])

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    toggleTheme,
    setThemeMode,
  }), [mode, setThemeMode, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
