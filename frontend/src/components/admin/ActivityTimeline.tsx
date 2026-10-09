import { useTranslation } from 'react-i18next'
import type { ActivityLogEntry } from '../../types/adminDashboard'

interface ActivityTimelineProps {
  items: ActivityLogEntry[]
}

export default function ActivityTimeline({ items }: ActivityTimelineProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {t('adminDashboard.recentActivity')}
      </h2>
      <ul className="mt-4 space-y-0">
        {items.length === 0 ? (
          <li className="py-6 text-center text-sm text-slate-500">
            {t('adminDashboard.noActivity')}
          </li>
        ) : (
          items.map((item, index) => (
            <li key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
              {index < items.length - 1 && (
                <span
                  className="absolute start-[11px] top-6 h-full w-0.5 bg-slate-200 dark:bg-slate-600"
                  aria-hidden
                />
              )}
              <span className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-800" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 dark:text-slate-200">{item.description}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.user?.name ?? '—'} · {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
