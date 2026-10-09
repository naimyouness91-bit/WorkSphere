import { useTranslation } from 'react-i18next'
import type { GamificationPoints } from '../../types/gamification'

interface PointsTrackerProps {
  points: GamificationPoints
}

function formatReason(reason: string): string {
  return reason.replace(/_/g, ' ')
}

export default function PointsTracker({ points }: PointsTrackerProps) {
  const { t } = useTranslation()

  return (
    <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-indigo-50 p-6 shadow-sm dark:border-violet-900/50 dark:from-violet-950/50 dark:via-fuchsia-950/30 dark:to-indigo-950/50">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
            {t('gamification.totalPoints')}
          </p>
          <p className="text-4xl font-bold text-violet-900 dark:text-violet-100">
            {points.total_points}
          </p>
        </div>
        <div className="rounded-xl bg-white/60 px-4 py-2 backdrop-blur dark:bg-slate-900/50">
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('gamification.level')}</p>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{points.level}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-xs text-slate-600 dark:text-slate-400">
          <span>{t('gamification.progressToLevel', { level: points.level + 1 })}</span>
          <span>{points.progress_percent}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/80 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 transition-all duration-700"
            style={{ width: `${points.progress_percent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('gamification.nextLevelAt', { points: points.next_level_at })}
        </p>
      </div>

      {points.history.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('gamification.recentActivity')}
          </h3>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {points.history.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-2 text-sm dark:bg-slate-900/40"
              >
                <span className="capitalize text-slate-700 dark:text-slate-300">
                  {formatReason(item.reason)}
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{item.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
