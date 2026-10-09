import { useTranslation } from 'react-i18next'
import type { Milestone } from '../../types/projectManagement'

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
  completed: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
  missed: 'border-red-400 bg-red-50 dark:bg-red-950/40',
}

interface MilestoneTimelineProps {
  milestones: Milestone[]
}

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const { t } = useTranslation()

  if (milestones.length === 0) {
    return <p className="text-sm text-slate-500">{t('projectMgmt.noMilestones')}</p>
  }

  const sorted = [...milestones].sort(
    (a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime(),
  )

  return (
    <ol className="relative border-s border-slate-200 dark:border-slate-700">
      {sorted.map((m) => (
        <li key={m.id} className="mb-6 ms-6">
          <span
            className={`absolute flex h-3 w-3 -start-1.5 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-900 ${
              m.status === 'completed'
                ? 'border-emerald-500'
                : m.status === 'missed'
                  ? 'border-red-500'
                  : 'border-indigo-500'
            }`}
          />
          <div className={`rounded-lg border p-3 ${STATUS_STYLES[m.status] ?? ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">{m.title}</h4>
              <span className="text-xs text-slate-500">{m.target_date}</span>
            </div>
            <p className="mt-1 text-xs capitalize text-slate-600 dark:text-slate-400">
              {t(`projectMgmt.milestoneStatus.${m.status}`)}
              {m.is_upcoming && ` · ${t('projectMgmt.upcoming')}`}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
