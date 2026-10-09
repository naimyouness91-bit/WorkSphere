import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { securityApi } from '../../services/securityApi'
import type { AlertSeverity, PersistentSecurityAlert } from '../../types/security'

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  low: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  medium: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  high: 'bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-200',
}

export default function PersistentAlertsPanel() {
  const { t } = useTranslation()
  const [alerts, setAlerts] = useState<PersistentSecurityAlert[]>([])
  const [statusFilter, setStatusFilter] = useState('open')
  const [severityFilter, setSeverityFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const { data } = await securityApi.alerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      })
      setAlerts(data.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, severityFilter])

  useEffect(() => {
    load()
  }, [load])

  // Re-show the loader while refetching after a filter change (adjust state
  // during render instead of setting it inside load()).
  const filterKey = `${statusFilter}:${severityFilter}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setLoading(true)
  }

  const handleResolve = async (id: number) => {
    setLoading(true)
    try {
      await securityApi.resolveAlert(id)
      await load()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t('security.alertsTitle')}
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="open">{t('security.status.open')}</option>
            <option value="resolved">{t('security.status.resolved')}</option>
            <option value="">{t('security.status.all')}</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="">{t('security.severity.all')}</option>
            <option value="high">{t('security.severity.high')}</option>
            <option value="medium">{t('security.severity.medium')}</option>
            <option value="low">{t('security.severity.low')}</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">{t('common.loading')}</p>
      ) : alerts.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t('security.noAlerts')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{alert.title}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[alert.severity]}`}>
                      {t(`security.severity.${alert.severity}`)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                      {t(`security.status.${alert.status}`)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{alert.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
                {alert.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => handleResolve(alert.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    {t('security.resolveAlert')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
