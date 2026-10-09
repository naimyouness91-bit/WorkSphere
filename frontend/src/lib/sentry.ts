import * as Sentry from '@sentry/react'
import { appEnv, appVersion, isDevelopment, sentryDsn } from '../config/env'

export function initSentry(): void {
  if (!sentryDsn || isDevelopment) {
    return
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: appEnv,
    release: `worksphere@${appVersion}`,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: appEnv === 'production' ? 0.2 : 0.5,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

export { Sentry }
