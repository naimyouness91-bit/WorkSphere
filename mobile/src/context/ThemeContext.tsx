import React, { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  isDark: boolean
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  colors: typeof lightColors
}

const lightColors = {
  bg: '#f8fafc',
  card: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  primary: '#1e3a8a',
  primaryLight: '#3b82f6',
  accent: '#7dd3fc',
}

const darkColors = {
  bg: '#020617',
  card: '#0f172a',
  text: '#f1f5f9',
  muted: '#94a3b8',
  border: '#334155',
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  accent: '#1e40af',
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme()
  const [mode, setModeState] = useState<ThemeMode>('system')

  useEffect(() => {
    AsyncStorage.getItem('theme_mode').then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v)
    })
  }, [])

  const setMode = (m: ThemeMode) => {
    setModeState(m)
    AsyncStorage.setItem('theme_mode', m)
  }

  const isDark = mode === 'dark' || (mode === 'system' && system === 'dark')
  const colors = isDark ? darkColors : lightColors

  return (
    <ThemeContext.Provider value={{ isDark, mode, setMode, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
