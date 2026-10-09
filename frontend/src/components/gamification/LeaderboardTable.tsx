import { useTranslation } from 'react-i18next'
import type { LeaderboardDepartment, LeaderboardEmployee } from '../../types/gamification'

interface LeaderboardTableProps {
  employees: LeaderboardEmployee[]
  departments: LeaderboardDepartment[]
  userRank: number | null
  scope: 'company' | 'department'
  onScopeChange: (scope: 'company' | 'department') => void
}

export default function LeaderboardTable({
  employees,
  departments,
  userRank,
  scope,
  onScopeChange,
}: LeaderboardTableProps) {
  const { t } = useTranslation()

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('gamification.leaderboard')}
        </h2>
        {userRank != null && (
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
            {t('gamification.yourRank', { rank: userRank })}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(['company', 'department'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onScopeChange(s)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              scope === s
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {s === 'company' ? t('gamification.companyWide') : t('gamification.myDepartment')}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">#</th>
              <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
                {t('gamification.employee')}
              </th>
              <th className="hidden px-4 py-3 font-semibold text-slate-600 sm:table-cell dark:text-slate-400">
                {t('gamification.department')}
              </th>
              <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">
                {t('gamification.points')}
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.slice(0, 15).map((row) => (
              <tr
                key={row.user_id}
                className="border-b border-slate-100 last:border-0 dark:border-slate-700/50"
              >
                <td className="px-4 py-3">
                  <RankBadge rank={row.rank} />
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                  {row.name}
                </td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell dark:text-slate-400">
                  {row.department}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                  {row.total_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('gamification.departmentCompetition')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {departments.slice(0, 6).map((dept) => (
            <div
              key={dept.department}
              className="flex items-center justify-between rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-teal-950/40"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{dept.department}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('gamification.members', { count: dept.member_count })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {dept.total_points}
                </p>
                <p className="text-xs text-slate-500">#{dept.rank}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg" title="1st">🥇</span>
  if (rank === 2) return <span className="text-lg" title="2nd">🥈</span>
  if (rank === 3) return <span className="text-lg" title="3rd">🥉</span>
  return <span className="text-slate-500">{rank}</span>
}
