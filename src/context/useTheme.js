import { useContext } from 'react'
import { ThemeContext } from './theme-context'

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    return {
      mode: 'dark',
      isDark: true,
      toggleTheme: () => {},
      setThemeMode: () => {},
    }
  }
  return ctx
}
