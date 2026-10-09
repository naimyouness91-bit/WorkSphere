import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ThemeMode, ThemeSettings } from '../types/settings'
import { ThemeContext, type ThemePreview } from './theme'

const STORAGE_KEY = 'worksphere_theme'
const COLORS_KEY = 'worksphere_theme_colors'

const DEFAULT_PRIMARY = '#4f46e5'
const DEFAULT_SECONDARY = '#6366f1'

function applyCssVariables(primary: string, secondary: string) {
  document.documentElement.style.setProperty('--ws-primary', primary)
  document.documentElement.style.setProperty('--ws-secondary', secondary)
}

function applyDarkClass(theme: ThemeMode) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light' || stored === 'custom') {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialColors(): { primary: string; secondary: string } {
  try {
    const raw = localStorage.getItem(COLORS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { primary?: string; secondary?: string }
      return {
        primary: parsed.primary ?? DEFAULT_PRIMARY,
        secondary: parsed.secondary ?? DEFAULT_SECONDARY,
      }
    }
  } catch {
    /* ignore */
  }
  return { primary: DEFAULT_PRIMARY, secondary: DEFAULT_SECONDARY }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [{ primary: primaryColor, secondary: secondaryColor }, setColorState] =
    useState(getInitialColors)
  const [preview, setPreview] = useState<ThemePreview | null>(null)

  const active = preview ?? { theme, primary_color: primaryColor, secondary_color: secondaryColor }

  useEffect(() => {
    applyDarkClass(active.theme)
    applyCssVariables(active.primary_color, active.secondary_color)
    if (!preview) {
      localStorage.setItem(STORAGE_KEY, theme)
      localStorage.setItem(
        COLORS_KEY,
        JSON.stringify({ primary: primaryColor, secondary: secondaryColor }),
      )
    }
  }, [active.theme, active.primary_color, active.secondary_color, preview, theme, primaryColor, secondaryColor])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
    setPreview(null)
  }, [])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setTheme(mode)
    setPreview(null)
  }, [])

  const setColors = useCallback((primary: string, secondary: string) => {
    setColorState({ primary, secondary })
    setPreview(null)
  }, [])

  const applyFromServer = useCallback((settings: ThemeSettings) => {
    setTheme(settings.theme)
    setColorState({
      primary: settings.primary_color,
      secondary: settings.secondary_color,
    })
    setPreview(null)
  }, [])

  const startPreview = useCallback((p: ThemePreview) => {
    setPreview(p)
  }, [])

  const cancelPreview = useCallback(() => {
    setPreview(null)
  }, [])

  const commitPreview = useCallback(() => {
    if (!preview) return null
    setTheme(preview.theme)
    setColorState({ primary: preview.primary_color, secondary: preview.secondary_color })
    const committed = preview
    setPreview(null)
    return committed
  }, [preview])

  const value = useMemo(
    () => ({
      theme,
      isDark: active.theme === 'dark',
      primaryColor,
      secondaryColor,
      preview,
      toggleTheme,
      setThemeMode,
      setColors,
      applyFromServer,
      startPreview,
      cancelPreview,
      commitPreview,
    }),
    [
      theme,
      active.theme,
      primaryColor,
      secondaryColor,
      preview,
      toggleTheme,
      setThemeMode,
      setColors,
      applyFromServer,
      startPreview,
      cancelPreview,
      commitPreview,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
