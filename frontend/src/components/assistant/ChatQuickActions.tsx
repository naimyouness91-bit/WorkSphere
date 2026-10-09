import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../hooks/redux'

export default function ChatQuickActions() {
  const { t } = useTranslation()
  const { user } = useAppSelector((state) => state.auth)
  const isApprover = user?.role === 'admin' || user?.role === 'manager'

  const actions = [
    ...(isApprover
      ? [{ key: 'approve', path: '/requests', label: t('assistant.quickActions.approveRequest') }]
      : []),
    { key: 'training', path: '/training', label: t('assistant.quickActions.scheduleTraining') },
    { key: 'request', path: '/requests', label: t('assistant.quickActions.createRequest') },
    { key: 'calendar', path: '/calendar', label: t('assistant.quickActions.viewCalendar') },
  ]

  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-700">
      {actions.map((a) => (
        <Link
          key={a.key}
          to={a.path}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
        >
          {a.label}
        </Link>
      ))}
    </div>
  )
}
