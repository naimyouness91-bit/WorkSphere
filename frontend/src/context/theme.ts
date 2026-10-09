import { createContext, useContext } from 'react'
import type { ThemeMode, ThemeSettings } from '../types/settings'

export interface ThemePreview {
  theme: ThemeMode
  primary_color: string
  secondary_color: string
}

export interface ThemeContextValue {
  theme: ThemeMode
  isDark: boolean
  primaryColor: string
  secondaryColor: string
  preview: ThemePreview | null
  toggleTheme: () => void
  setThemeMode: (mode: ThemeMode) => void
  setColors: (primary: string, secondary: string) => void
  applyFromServer: (settings: ThemeSettings) => void
  startPreview: (preview: ThemePreview) => void
  cancelPreview: () => void
  commitPreview: () => ThemePreview | null
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
