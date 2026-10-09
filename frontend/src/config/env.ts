export type AppEnvironment = 'development' | 'staging' | 'production'

const rawEnv = import.meta.env.VITE_APP_ENV as string | undefined

export const appEnv: AppEnvironment =
  rawEnv === 'staging' || rawEnv === 'production' ? rawEnv : 'development'

export const isProduction = appEnv === 'production'
export const isStaging = appEnv === 'staging'
export const isDevelopment = appEnv === 'development'

export const apiUrl = import.meta.env.VITE_API_URL ?? '/api'
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
export const defaultLocale = import.meta.env.VITE_DEFAULT_LOCALE ?? 'en'
export const sentryDsn = import.meta.env.VITE_SENTRY_DSN ?? ''
export const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0'

export const envConfig = {
  appEnv,
  isProduction,
  isStaging,
  isDevelopment,
  apiUrl,
  apiBaseUrl,
  defaultLocale,
  sentryDsn,
  appVersion,
} as const
