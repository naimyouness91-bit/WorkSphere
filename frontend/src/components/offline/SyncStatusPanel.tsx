import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useOfflineSync } from '../../hooks/useOfflineSync'

function formatWhen(iso: string | null, t: (key: string) => string): string {
  if (!iso) return t('offline.never')
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

interface Props {
  compact?: boolean
}

export default function SyncStatusPanel({ compact = false }: Props) {
  const { t } = useTranslation()
  const { online, lastSyncAt, pendingCount, syncing, manualSync } = useOfflineSync()

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
            online
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {online ? t('offline.online') : t('offline.offline')}
        </span>
        {pendingCount > 0 && (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-violet-700 dark:text-violet-300">
            {t('offline.pendingShort', { count: pendingCount })}
          </span>
        )}
        <button
          type="button"
          onClick={() => void manualSync()}
          disabled={!online || syncing}
          className="text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
        >
          {syncing ? t('offline.syncing') : t('offline.syncNow')}
        </button>
      </div>
    )
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('offline.syncPanelTitle')}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('offline.lastSync')}: {formatWhen(lastSyncAt, t)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('offline.pendingChanges')}: {pendingCount}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium ${
              online
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
            }`}
          >
            {online ? t('offline.online') : t('offline.offline')}
          </span>
          <button
            type="button"
            onClick={() => void manualSync()}
            disabled={!online || syncing}
            className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {syncing ? t('offline.syncing') : t('offline.forceSync')}
          </button>
          <Link
            to="/mobile-offline"
            className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('offline.viewDetails')}
          </Link>
        </div>
      </div>
    </section>
  )
}
