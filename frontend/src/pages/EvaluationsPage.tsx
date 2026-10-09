import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import EvaluationFiltersBar from '../components/evaluation/EvaluationFiltersBar'
import EvaluationFormModal from '../components/evaluation/EvaluationFormModal'
import KpiCard from '../components/KpiCard'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { usersApi } from '../services/usersApi'
import {
  fetchEvaluationDepartments,
  fetchEvaluationSummary,
  fetchEvaluations,
  openCreateEvaluationForm,
  openEditEvaluationForm,
  setEvaluationFilters,
} from '../store/evaluationsSlice'
import type { AppUser } from '../types/userList'
import type { Evaluation } from '../types/evaluation'
import { exportEvaluationsToExcel, exportEvaluationsToPdf } from '../utils/exportEvaluations'
import { scoreColorClass, STATUS_STYLES } from '../utils/evaluationScore'

export default function EvaluationsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters, summary, departments } = useAppSelector((s) => s.evaluations)
  const [users, setUsers] = useState<AppUser[]>([])

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchEvaluations(filters))
      if (isManager) {
        dispatch(fetchEvaluationSummary(filters))
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters, isManager])

  useEffect(() => {
    if (isManager) {
      usersApi.index().then((res) => setUsers(res.data.data))
      dispatch(fetchEvaluationDepartments())
    }
  }, [isManager, dispatch])

  // Build the employee list based on the signed-in user. Fetching the full
  // list is handled on mount via the manager gate; only the single-user
  // snapshot is adjusted during render.
  const [prevUsersKey, setPrevUsersKey] = useState(user)
  if (prevUsersKey !== user) {
    setPrevUsersKey(user)
    if (!isManager && user) {
      setUsers([{ id: user.id, name: user.name, email: user.email, role: user.role }])
    }
  }

  const renderRow = (evaluation: Evaluation) => (
    <tr key={evaluation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
        {evaluation.employee?.name ?? '—'}
      </td>
      {isManager && (
        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
          {evaluation.evaluator?.name ?? '—'}
        </td>
      )}
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
        {evaluation.review_period}
      </td>
      <td className={`px-4 py-3 text-sm font-semibold tabular-nums ${scoreColorClass(evaluation.score)}`}>
        {evaluation.score.toFixed(1)} / 5
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[evaluation.status] ?? ''}`}
        >
          {t(`evaluations.status.${evaluation.status}`)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
        {evaluation.comments || '—'}
      </td>
      {isManager && (
        <td className="px-4 py-3 text-end">
          <button
            type="button"
            onClick={() => dispatch(openEditEvaluationForm(evaluation))}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            {t('evaluations.edit')}
          </button>
        </td>
      )}
    </tr>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {t('evaluations.title')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {isManager ? t('evaluations.subtitleManager') : t('evaluations.subtitleEmployee')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportEvaluationsToExcel(items)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('evaluations.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportEvaluationsToPdf(items, t('evaluations.exportTitle'))}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('evaluations.exportPdf')}
          </button>
          {isManager && (
            <button
              type="button"
              onClick={() => dispatch(openCreateEvaluationForm())}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('evaluations.newEvaluation')}
            </button>
          )}
        </div>
      </div>

      {isManager && summary && (
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <KpiCard
            label={t('evaluations.kpiAverageScore')}
            value={summary.overall_average.toFixed(2)}
            subtext={t('evaluations.kpiScale')}
            accent="indigo"
          />
          <div className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm dark:border-emerald-900/50 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('evaluations.kpiTopPerformers')}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {summary.top_performers.length === 0 ? (
                <li className="text-slate-400">{t('evaluations.noData')}</li>
              ) : (
                summary.top_performers.map((p) => (
                  <li key={p.employee_id} className="flex justify-between text-emerald-700 dark:text-emerald-300">
                    <span>{p.employee_name}</span>
                    <span className="font-semibold">{p.average_score.toFixed(1)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm dark:border-amber-900/50 dark:bg-slate-800">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t('evaluations.kpiNeedsImprovement')}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {summary.needs_improvement.length === 0 ? (
                <li className="text-slate-400">{t('evaluations.noNeedsImprovement')}</li>
              ) : (
                summary.needs_improvement.map((p) => (
                  <li key={p.employee_id} className="flex justify-between text-amber-700 dark:text-amber-300">
                    <span>{p.employee_name}</span>
                    <span className="font-semibold">{p.average_score.toFixed(1)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      )}

      <div className="mt-6">
        <EvaluationFiltersBar
          filters={filters}
          departments={departments}
          users={users}
          showManagerFilters={isManager}
          onChange={(f) => dispatch(setEvaluationFilters(f))}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {status === 'loading' ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('evaluations.loading')}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('evaluations.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('evaluations.employee')}
                  </th>
                  {isManager && (
                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                      {t('evaluations.evaluator')}
                    </th>
                  )}
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('evaluations.reviewPeriod')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('evaluations.score')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('evaluations.statusLabel')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('evaluations.comments')}
                  </th>
                  {isManager && (
                    <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-slate-600">
                      {t('evaluations.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map(renderRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isManager && <EvaluationFormModal users={users} />}
    </div>
  )
}
