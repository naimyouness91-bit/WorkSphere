import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { HomeActivityItem } from '../../services/homeApi'

const TYPE_STYLES: Record<string, string> = {
  request: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  document: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  evaluation: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
}

const TYPE_PATHS: Record<string, string> = {
  request: '/requests',
  document: '/documents',
  evaluation: '/evaluations',
}

interface Props {
  items: HomeActivityItem[]
}

export default function ActivityFeed({ items }: Props) {
  const { t, i18n } = useTranslation()

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <section className="animate-fade-in-up [animation-delay:300ms]">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('home.recentActivity')}</h2>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">{t('home.noActivity')}</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {items.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  to={TYPE_PATHS[item.type]}
                  className="flex flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30 sm:px-6"
                >
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[item.type] ?? TYPE_STYLES.request}`}
                  >
                    {t(`home.activityTypes.${item.type}`)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                    )}
                  </div>
                  {item.status && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {t(`status.${item.status}`, item.status)}
                    </span>
                  )}
                  <time className="text-xs text-slate-400">{formatTime(item.occurred_at)}</time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
