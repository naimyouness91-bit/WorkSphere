import { useTranslation } from 'react-i18next'
import type { SecurityAlert } from '../../types/auditLog'

interface Props {
  alerts: SecurityAlert[]
}

export default function SecurityAlertsPanel({ alerts }: Props) {
  const { t } = useTranslation()

  if (alerts.length === 0) return null

  return (
    <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
        <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" aria-hidden />
        {t('audit.securityAlerts')}
      </h2>
      <ul className="mt-3 space-y-2">
        {alerts.map((alert, index) => (
          <li
            key={`${alert.type}-${index}`}
            className={`rounded-lg px-3 py-2 text-sm ${
              alert.severity === 'high'
                ? 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200'
                : 'bg-amber-100/80 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'
            }`}
          >
            {alert.message}
          </li>
        ))}
      </ul>
    </section>
  )
}
