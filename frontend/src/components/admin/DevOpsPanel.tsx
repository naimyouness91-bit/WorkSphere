import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import KpiCard from '../KpiCard'
import LoadingSpinner from '../LoadingSpinner'
import { useAppDispatch } from '../../hooks/redux'
import { devopsApi, type DeploymentRecord, type DevOpsMetrics } from '../../services/devopsApi'
import { addNotification } from '../../store/notificationSlice'

interface Props {
  initialMetrics?: DevOpsMetrics | null
  initialDeployments?: DeploymentRecord[]
}

export default function DevOpsPanel({ initialMetrics, initialDeployments }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [metrics, setMetrics] = useState<DevOpsMetrics | null>(initialMetrics ?? null)
  const [deployments, setDeployments] = useState<DeploymentRecord[]>(initialDeployments ?? [])
  const [loading, setLoading] = useState(!initialMetrics)
  const [rollingBack, setRollingBack] = useState<number | null>(null)

  const load = useCallback(() => {
    devopsApi
      .deployments()
      .then((res) => {
        setMetrics(res.data.data.metrics)
        setDeployments(res.data.data.deployments)
      })
      .catch(() => dispatch(addNotification({ type: 'error', message: t('devops.loadFailed') })))
      .finally(() => setLoading(false))
  }, [dispatch, t])

  useEffect(() => {
    if (!initialMetrics) load()
  }, [initialMetrics, load])

  const handleRollback = async (id: number) => {
    setRollingBack(id)
    try {
      const { data } = await devopsApi.rollback(id)
      dispatch(addNotification({ type: 'success', message: data.message }))
      load()
    } catch {
      dispatch(addNotification({ type: 'error', message: t('devops.rollbackFailed') }))
    } finally {
      setRollingBack(null)
    }
  }

  if (loading && !metrics) {
    return <LoadingSpinner label={t('devops.loading')} />
  }

  if (!metrics) return null

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('devops.title')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('devops.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label={t('devops.kpiBuildSuccess')}
          value={`${metrics.build_success_rate}%`}
          accent="emerald"
        />
        <KpiCard
          label={t('devops.kpiDeployFrequency')}
          value={metrics.deployment_frequency}
          subtext={t('devops.kpiDeployFrequencySub')}
          accent="indigo"
        />
        <KpiCard
          label={t('devops.kpiErrorRate')}
          value={`${metrics.error_rate}%`}
          accent="amber"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {t('devops.activeStaging')}: {metrics.active_staging_version ?? '—'}
        </span>
        <span>
          {t('devops.activeProduction')}: {metrics.active_production_version ?? '—'}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-3">{t('devops.colEnv')}</th>
              <th className="px-4 py-3">{t('devops.colVersion')}</th>
              <th className="px-4 py-3">{t('devops.colStatus')}</th>
              <th className="px-4 py-3">{t('devops.colWhen')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {deployments.map((d) => (
              <tr key={d.id} className="bg-white dark:bg-slate-900">
                <td className="px-4 py-2 font-medium capitalize">{d.environment}</td>
                <td className="px-4 py-2 font-mono text-xs">{d.version}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      d.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : d.status === 'failed'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    {d.status}
                  </span>
                  {d.is_active && (
                    <span className="ms-2 text-xs text-indigo-600 dark:text-indigo-400">
                      {t('devops.active')}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {d.finished_at ? new Date(d.finished_at).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-2 text-end">
                  {d.status === 'failed' && (
                    <button
                      type="button"
                      disabled={rollingBack === d.id}
                      onClick={() => void handleRollback(d.id)}
                      className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
                    >
                      {rollingBack === d.id ? t('devops.rollingBack') : t('devops.rollback')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
