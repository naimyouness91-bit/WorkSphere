import { useTranslation } from 'react-i18next'
import type { WeeklyChallenge } from '../../types/gamification'

interface WeeklyChallengesProps {
  challenges: WeeklyChallenge[]
}

export default function WeeklyChallenges({ challenges }: WeeklyChallengesProps) {
  const { t } = useTranslation()

  if (challenges.length === 0) {
    return null
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {t('gamification.weeklyChallenges')}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {t('gamification.weeklyChallengesHint')}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => {
          const pct = Math.min(
            100,
            Math.round((challenge.progress / challenge.target_count) * 100),
          )

          return (
            <article
              key={challenge.id}
              className={`rounded-2xl border p-5 transition-shadow ${
                challenge.completed
                  ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                  : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {challenge.title}
                </h3>
                {challenge.completed && (
                  <span className="shrink-0 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
                    ✓
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {challenge.description}
              </p>
              {challenge.department && (
                <p className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {t('gamification.deptChallenge', { dept: challenge.department })}
                </p>
              )}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>
                    {challenge.progress} / {challenge.target_count}
                  </span>
                  <span>+{challenge.points_reward} pts</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/80 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      challenge.completed
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {t('gamification.endsOn', { date: challenge.week_end })}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
