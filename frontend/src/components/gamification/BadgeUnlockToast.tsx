import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { GamificationBadge } from '../../types/gamification'

interface BadgeUnlockToastProps {
  badge: GamificationBadge
  onDismiss: () => void
}

export default function BadgeUnlockToast({ badge, onDismiss }: BadgeUnlockToastProps) {
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      className="fixed inset-x-4 top-20 z-50 mx-auto max-w-md animate-badge-unlock sm:inset-x-auto sm:right-6 sm:left-auto"
      role="alert"
    >
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 p-5 shadow-xl dark:border-amber-800/50 dark:from-amber-950/80 dark:via-orange-950/60 dark:to-rose-950/60">
        <span
          className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 animate-confetti-pop rounded-full bg-amber-400/30"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -bottom-2 -left-2 h-16 w-16 animate-confetti-pop rounded-full bg-violet-400/20 [animation-delay:200ms]"
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          {t('gamification.badgeUnlocked')}
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">{badge.title}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{badge.description}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 text-xs font-medium text-amber-800 underline dark:text-amber-200"
        >
          {t('gamification.dismiss')}
        </button>
      </div>
    </div>
  )
}
