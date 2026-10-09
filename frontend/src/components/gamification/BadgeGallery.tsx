import { useTranslation } from 'react-i18next'
import type { GamificationBadge } from '../../types/gamification'

const colorMap: Record<string, string> = {
  sky: 'from-sky-400 to-cyan-500 border-sky-200 dark:border-sky-800',
  indigo: 'from-indigo-400 to-violet-500 border-indigo-200 dark:border-indigo-800',
  emerald: 'from-emerald-400 to-teal-500 border-emerald-200 dark:border-emerald-800',
  violet: 'from-violet-400 to-purple-500 border-violet-200 dark:border-violet-800',
  amber: 'from-amber-400 to-orange-500 border-amber-200 dark:border-amber-800',
  rose: 'from-rose-400 to-pink-500 border-rose-200 dark:border-rose-800',
  fuchsia: 'from-fuchsia-400 to-pink-500 border-fuchsia-200 dark:border-fuchsia-800',
  cyan: 'from-cyan-400 to-blue-500 border-cyan-200 dark:border-cyan-800',
}

function badgeEmoji(icon: string): string {
  const map: Record<string, string> = {
    'paper-plane': '✈️',
    'clipboard-list': '📋',
    'check-circle': '✅',
    'graduation-cap': '🎓',
    star: '⭐',
    'folder-open': '📁',
    coins: '🪙',
    'diagram-project': '📊',
    trophy: '🏆',
  }
  return map[icon] ?? '🏅'
}

interface BadgeGalleryProps {
  badges: GamificationBadge[]
}

export default function BadgeGallery({ badges }: BadgeGalleryProps) {
  const { t } = useTranslation()
  const earned = badges.filter((b) => b.earned)
  const locked = badges.filter((b) => !b.earned)

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('gamification.badgesEarned', { count: earned.length, total: badges.length })}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {earned.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} earned />
          ))}
        </div>
      </div>
      {locked.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t('gamification.badgesLocked')}
          </h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} earned={false} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function BadgeCard({ badge, earned }: { badge: GamificationBadge; earned: boolean }) {
  const gradient = colorMap[badge.color] ?? colorMap.indigo

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${
        earned
          ? `bg-gradient-to-br ${gradient} shadow-md hover:-translate-y-0.5 hover:shadow-lg`
          : 'border-slate-200 bg-slate-100/80 opacity-70 grayscale dark:border-slate-700 dark:bg-slate-800/50'
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl ${
          earned ? 'bg-white/25 backdrop-blur' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        {badgeEmoji(badge.icon)}
      </div>
      <h4
        className={`mt-3 font-semibold ${earned ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}
      >
        {badge.title}
      </h4>
      <p className={`mt-1 text-sm ${earned ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>
        {badge.description}
      </p>
      {badge.points_reward > 0 && (
        <p
          className={`mt-2 text-xs font-medium ${earned ? 'text-white/80' : 'text-slate-400'}`}
        >
          +{badge.points_reward} pts
        </p>
      )}
      {!earned && (
        <span className="absolute right-3 top-3 text-lg opacity-60" aria-hidden>
          🔒
        </span>
      )}
    </article>
  )
}
