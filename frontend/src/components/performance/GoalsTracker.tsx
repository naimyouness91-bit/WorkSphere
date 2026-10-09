import { useTranslation } from 'react-i18next'
import type { PerformanceGoal } from '../../types/performance'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-slate-200 dark:bg-slate-700',
  in_progress: 'bg-amber-500',
  achieved: 'bg-emerald-500',
  cancelled: 'bg-red-400',
}

interface GoalsTrackerProps {
  goals: PerformanceGoal[]
}

export default function GoalsTracker({ goals }: GoalsTrackerProps) {
  const { t } = useTranslation()

  if (goals.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{t('performance.noGoals')}</p>
  }

  return (
    <ul className="space-y-4">
      {goals.map((goal) => (
        <li
          key={goal.id}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">{goal.title}</h4>
              {goal.description && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{goal.description}</p>
              )}
            </div>
            <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
              {t(`performance.goalStatus.${goal.status}`)}
            </span>
          </div>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>{t('performance.progress')}</span>
              <span>{goal.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all ${STATUS_COLORS[goal.status] ?? 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, goal.progress)}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {t('performance.targetDate')}: {goal.target_date}
          </p>
        </li>
      ))}
    </ul>
  )
}
