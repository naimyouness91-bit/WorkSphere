import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BadgeGallery from '../components/gamification/BadgeGallery'
import BadgeUnlockToast from '../components/gamification/BadgeUnlockToast'
import LeaderboardTable from '../components/gamification/LeaderboardTable'
import PointsTracker from '../components/gamification/PointsTracker'
import WeeklyChallenges from '../components/gamification/WeeklyChallenges'
import LoadingSpinner from '../components/LoadingSpinner'
import { gamificationApi } from '../services/gamificationApi'
import type {
  GamificationBadge,
  GamificationOverview,
  LeaderboardDepartment,
  LeaderboardEmployee,
} from '../types/gamification'

export default function GamificationPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<GamificationOverview | null>(null)
  const [leaderboardScope, setLeaderboardScope] = useState<'company' | 'department'>('company')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEmployee[] | null>(null)
  const [departments, setDepartments] = useState<LeaderboardDepartment[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [unlockBadge, setUnlockBadge] = useState<GamificationBadge | null>(null)
  const knownEarnedRef = useRef<Set<number>>(new Set())
  const initializedRef = useRef(false)

  const detectNewBadges = useCallback((badges: GamificationBadge[]) => {
    const earnedIds = badges.filter((b) => b.earned).map((b) => b.id)
    if (!initializedRef.current) {
      earnedIds.forEach((id) => knownEarnedRef.current.add(id))
      initializedRef.current = true
      return
    }
    for (const badge of badges) {
      if (badge.earned && !knownEarnedRef.current.has(badge.id)) {
        knownEarnedRef.current.add(badge.id)
        setUnlockBadge(badge)
        break
      }
    }
  }, [])

  useEffect(() => {
    gamificationApi
      .overview()
      .then((res) => {
        const data = res.data.data
        setOverview(data)
        detectNewBadges(data.badges)
      })
      .finally(() => setLoading(false))
  }, [detectNewBadges])

  useEffect(() => {
    gamificationApi.leaderboard(leaderboardScope).then((res) => {
      setLeaderboard(res.data.data.employees)
      setDepartments(res.data.data.departments)
      setUserRank(res.data.data.user_rank)
    })
  }, [leaderboardScope])

  if (loading && !overview) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <LoadingSpinner label={t('gamification.loading')} />
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-red-600 dark:text-red-400">
        {t('gamification.loadFailed')}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {unlockBadge && (
        <BadgeUnlockToast badge={unlockBadge} onDismiss={() => setUnlockBadge(null)} />
      )}

      <header className="mb-8 animate-fade-in-up">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 p-6 text-white shadow-lg dark:border-indigo-800">
          <h1 className="text-2xl font-bold">{t('gamification.title')}</h1>
          <p className="mt-2 text-indigo-100">{t('gamification.subtitle')}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <StatPill label={t('gamification.level')} value={overview.stats.level} />
            <StatPill label={t('gamification.totalPoints')} value={overview.stats.total_points} />
            <StatPill
              label={t('gamification.badges')}
              value={`${overview.stats.badges_earned}/${overview.stats.badges_total}`}
            />
            {overview.stats.company_rank != null && (
              <StatPill
                label={t('gamification.rank')}
                value={`#${overview.stats.company_rank}`}
              />
            )}
          </div>
        </div>
      </header>

      <div className="space-y-10">
        <div className="animate-fade-in-up [animation-delay:50ms]">
          <PointsTracker points={overview.points} />
        </div>

        <div className="animate-fade-in-up [animation-delay:100ms]">
          <WeeklyChallenges challenges={overview.challenges} />
        </div>

        <div className="animate-fade-in-up [animation-delay:150ms]">
          <BadgeGallery badges={overview.badges} />
        </div>

        {leaderboard && (
          <div className="animate-fade-in-up [animation-delay:200ms]">
            <LeaderboardTable
              employees={leaderboard}
              departments={departments}
              userRank={userRank}
              scope={leaderboardScope}
              onScopeChange={setLeaderboardScope}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-white/20 px-3 py-1.5 backdrop-blur">
      <span className="text-indigo-100">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
