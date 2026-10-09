import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarPlus,
  faCloudArrowUp,
  faFileCirclePlus,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

const actions: {
  id: 'request' | 'document' | 'event'
  path: string
  icon: IconDefinition
  accent: string
}[] = [
  {
    id: 'request',
    path: '/requests',
    icon: faFileCirclePlus,
    accent: 'from-indigo-500 to-indigo-600',
  },
  {
    id: 'document',
    path: '/documents',
    icon: faCloudArrowUp,
    accent: 'from-violet-500 to-violet-600',
  },
  {
    id: 'event',
    path: '/calendar',
    icon: faCalendarPlus,
    accent: 'from-emerald-500 to-teal-600',
  },
]

export default function QuickActions() {
  const { t } = useTranslation()

  return (
    <section className="animate-fade-in-up [animation-delay:200ms]">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('home.quickActions')}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.path}
            className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-800"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.accent} text-white shadow-md transition-transform duration-200 group-hover:scale-105`}
            >
              <FontAwesomeIcon icon={action.icon} className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {t(`home.actions.${action.id}`)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t(`home.actions.${action.id}Hint`)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
