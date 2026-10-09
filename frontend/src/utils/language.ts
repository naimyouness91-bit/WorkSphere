import type { AppLocale } from '../i18n'
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from '../i18n'

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function normalizeLocale(value?: string | null): AppLocale {
  if (!value) {
    return 'en'
  }
  const code = value.split('-')[0].toLowerCase()
  return isAppLocale(code) ? code : 'en'
}

export function getStoredLocale(): AppLocale {
  return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
}
