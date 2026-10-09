import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import SyncStatusPanel from '../components/offline/SyncStatusPanel'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { getOfflineBundle } from '../offline/db'
import { getCachedModuleCounts } from '../offline/syncManager'
import { mobileOfflineApi, type SyncLogEntry } from '../services/mobileOfflineApi'

export default function MobileOfflinePage() {
  const { t } = useTranslation()
  const { online, pendingCount } = useOfflineSync()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [logs, setLogs] = useState<SyncLogEntry[]>([])
  const [bundleAt, setBundleAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      getCachedModuleCounts(),
      getOfflineBundle(),
      online ? mobileOfflineApi.syncLogs().catch(() => null) : Promise.resolve(null),
    ])
      .then(([c, bundle, logRes]) => {
        if (!active) return
        setCounts(c)
        setBundleAt(bundle?.synced_at ?? null)
        setLogs(logRes?.data.data.logs ?? [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [online, pendingCount])

  const modules = [
    { key: 'tasks', label: t('offline.moduleTasks'), to: '/tasks' },
    { key: 'attendance', label: t('offline.moduleAttendance'), to: '/attendance' },
    { key: 'requests', label: t('offline.moduleRequests'), to: '/requests' },
    { key: 'policies', label: t('offline.modulePolicies'), to: '/compliance' },
  ] as const

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:py-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          {t('offline.mobileLabel')}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
          {t('offline.pageTitle')}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t('offline.pageSubtitle')}</p>
      </header>

      <SyncStatusPanel />

      {loading ? (
        <LoadingSpinner label={t('offline.loading')} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {modules.map((m) => (
              <Link
                key={m.key}
                to={m.to}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  {counts[m.key] ?? 0}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">{t('offline.cachedItems')}</p>
              </Link>
            ))}
          </section>

          {bundleAt && (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              {t('offline.bundleFetched')}: {new Date(bundleAt).toLocaleString()}
            </p>
          )}

          {logs.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">
                {t('offline.auditLog')}
              </h2>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.slice(0, 12).map((log) => (
                  <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{log.action}</span>
                    <span
                      className={`rounded px-2 py-0.5 ${
                        log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : log.status === 'conflict'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="w-full text-slate-500 sm:w-auto sm:text-end">
                      {new Date(log.occurred_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
