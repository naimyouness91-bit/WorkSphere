import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import GoalsTracker from '../components/performance/GoalsTracker'
import PerformanceCharts from '../components/performance/PerformanceCharts'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppSelector } from '../hooks/redux'
import { performanceApi } from '../services/performanceApi'
import { usersApi } from '../services/usersApi'
import type { AppUser } from '../types/userList'
import type { Feedback360, PerformanceOverview, PerformanceReview } from '../types/performance'
import { exportPerformanceToExcel, exportPerformanceToPdf } from '../utils/exportPerformance'

export default function PerformancePage() {
  const { t } = useTranslation()
  const { user } = useAppSelector((s) => s.auth)
  const isManager = user?.role === 'admin' || user?.role === 'manager'

  const [employeeId, setEmployeeId] = useState<number | undefined>(undefined)
  const [users, setUsers] = useState<AppUser[]>([])
  const [overview, setOverview] = useState<PerformanceOverview | null>(null)
  const [reviews, setReviews] = useState<PerformanceReview[]>([])
  const [feedback, setFeedback] = useState<Feedback360[]>([])
  const [loading, setLoading] = useState(true)

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')
  const [goalDate, setGoalDate] = useState('')
  const [reviewRating, setReviewRating] = useState(4)
  const [reviewComments, setReviewComments] = useState('')
  const [fbText, setFbText] = useState('')
  const [fbRating, setFbRating] = useState(4)
  const [fbAnonymous, setFbAnonymous] = useState(true)
  const [feedbackTargetId, setFeedbackTargetId] = useState<number | ''>('')

  const targetId = employeeId ?? user?.id

  // Initialize the target to the current user when none is set yet. Adjust
  // state during render instead of setting it inside an effect.
  const [emplInit, setEmplInit] = useState(false)
  if (!emplInit && user) {
    setEmplInit(true)
    if (employeeId === undefined) {
      setEmployeeId(user.id)
    }
  }

  const load = useCallback(() => {
    if (!targetId) return
    Promise.all([
      performanceApi.overview(targetId),
      performanceApi.getReviews(targetId),
      performanceApi.getFeedback360(targetId),
    ])
      .then(([ov, rev, fb]) => {
        const raw = ov.data.data
        setOverview({
          ...raw,
          goals: raw.goals as PerformanceOverview['goals'],
        })
        setReviews(rev.data.data)
        setFeedback(fb.data.data)
      })
      .finally(() => setLoading(false))
  }, [targetId])

  useEffect(() => {
    if (isManager) {
      usersApi.index().then((res) => setUsers(res.data.data))
    } else {
      performanceApi.colleagues().then((res) => setUsers(res.data.data))
    }
  }, [isManager])

  useEffect(() => {
    load()
  }, [load])

  const handleExportPdf = async () => {
    if (!targetId) return
    const res = await performanceApi.report(targetId)
    exportPerformanceToPdf(res.data.data, t('performance.reportTitle'))
  }

  const handleExportExcel = async () => {
    if (!targetId) return
    const res = await performanceApi.report(targetId)
    exportPerformanceToExcel(res.data.data)
  }

  const submitGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId) return
    setSubmitting(true)
    performanceApi
      .addGoal({
        employee_id: targetId,
        title: goalTitle,
        description: goalDesc || undefined,
        target_date: goalDate,
      })
      .then(() => {
        setShowGoalForm(false)
        setGoalTitle('')
        setGoalDesc('')
        setGoalDate('')
        load()
      })
      .finally(() => setSubmitting(false))
  }

  const submitReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId) return
    setSubmitting(true)
    performanceApi
      .addReview({
        employee_id: targetId,
        rating: reviewRating,
        comments: reviewComments || undefined,
      })
      .then(() => {
        setShowReviewForm(false)
        setReviewComments('')
        load()
      })
      .finally(() => setSubmitting(false))
  }

  const submitFeedback = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId || targetId === user?.id) return
    setSubmitting(true)
    performanceApi
      .addFeedback360({
        employee_id: targetId,
        feedback_text: fbText,
        rating: fbRating,
        is_anonymous: fbAnonymous,
      })
      .then(() => {
        setShowFeedbackForm(false)
        setFbText('')
        load()
      })
      .finally(() => setSubmitting(false))
  }

  if (loading && !overview) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <LoadingSpinner label={t('performance.loading')} />
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-red-600">{t('performance.loadFailed')}</div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-800 via-teal-700 to-slate-900 p-6 text-white shadow-lg dark:border-teal-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('performance.title')}</h1>
            <p className="mt-2 text-teal-100">{t('performance.subtitle')}</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">
              {overview.performance_score.score}
              <span className="text-lg font-normal text-teal-200"> / 100</span>
            </p>
            <p className="text-sm text-teal-200">{t('performance.overallScore')}</p>
          </div>
          {isManager && users.length > 0 && (
            <select
              value={employeeId ?? ''}
              onChange={(e) => setEmployeeId(Number(e.target.value))}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="text-slate-900">
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label={t('performance.kpiGoalsAchieved')}
          value={`${overview.kpis.goals_achieved}/${overview.kpis.goals_total}`}
          accent="emerald"
        />
        <KpiCard
          label={t('performance.kpiAvgRating')}
          value={overview.kpis.average_rating > 0 ? overview.kpis.average_rating.toFixed(1) : '—'}
          subtext="/ 5"
          accent="amber"
        />
        <KpiCard
          label={t('performance.kpiFeedbackCount')}
          value={overview.kpis.feedback_count}
          accent="indigo"
        />
      </section>

      {isManager && overview.can_manage && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowGoalForm((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
          >
            {t('performance.addGoal')}
          </button>
          <button
            type="button"
            onClick={() => setShowReviewForm((v) => !v)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
          >
            {t('performance.addReview')}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white"
          >
            {t('performance.exportPdf')}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white"
          >
            {t('performance.exportExcel')}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowFeedbackForm((v) => !v)}
        className="mb-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
      >
        {t('performance.giveFeedback')}
      </button>

      {showGoalForm && (
        <form onSubmit={submitGoal} className="mb-6 space-y-3 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <input
            required
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder={t('performance.goalTitle')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <textarea
            value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
            placeholder={t('performance.goalDescription')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            type="date"
            required
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <button type="submit" disabled={submitting} className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white">
            {t('performance.saveGoal')}
          </button>
        </form>
      )}

      {showReviewForm && (
        <form onSubmit={submitReview} className="mb-6 space-y-3 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <label className="block text-sm">
            {t('performance.rating')}: {reviewRating}
            <input
              type="range"
              min={1}
              max={5}
              step={0.5}
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <textarea
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            placeholder={t('performance.reviewComments')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <button type="submit" disabled={submitting} className="rounded-lg bg-teal-700 px-4 py-2 text-sm text-white">
            {t('performance.submitReview')}
          </button>
        </form>
      )}

      {showFeedbackForm && (
        <form onSubmit={submitFeedback} className="mb-6 space-y-3 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          {!isManager && (
            <select
              required
              value={feedbackTargetId}
              onChange={(e) => setFeedbackTargetId(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="">{t('performance.selectColleague')}</option>
              {users
                .filter((u) => u.id !== user?.id)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          )}
          <textarea
            required
            value={fbText}
            onChange={(e) => setFbText(e.target.value)}
            placeholder={t('performance.feedbackText')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <label className="block text-sm">
            {t('performance.rating')}: {fbRating}
            <input
              type="range"
              min={1}
              max={5}
              step={0.5}
              value={fbRating}
              onChange={(e) => setFbRating(Number(e.target.value))}
              className="mt-1 w-full"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fbAnonymous}
              onChange={(e) => setFbAnonymous(e.target.checked)}
            />
            {t('performance.anonymous')}
          </label>
          <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">
            {t('performance.submitFeedback')}
          </button>
        </form>
      )}

      <PerformanceCharts analytics={overview.analytics} />

      {overview.training_suggestions.length > 0 && (
        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
            {t('performance.trainingSuggestions')}
          </h2>
          <ul className="mt-3 space-y-2">
            {overview.training_suggestions.map((s, i) => (
              <li key={i} className="text-sm text-amber-950 dark:text-amber-100">
                <span className="font-medium">{s.title}</span>
                <span className="mx-2 rounded bg-amber-200/80 px-1.5 text-xs dark:bg-amber-800">
                  {s.priority}
                </span>
                — {s.reason}
                {s.training_id && (
                  <Link to="/training" className="ml-2 text-indigo-600 underline dark:text-indigo-400">
                    {t('performance.viewTraining')}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('performance.goalsSection')}
          </h2>
          <GoalsTracker goals={overview.goals} />
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('performance.reviewsSection')}
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">{t('performance.noReviews')}</p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {r.reviewer?.name ?? '—'}
                    </span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {r.rating.toFixed(1)} / 5
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{r.review_date}</p>
                  {r.comments && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{r.comments}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('performance.feedbackSection')}
        </h2>
        {feedback.length === 0 ? (
          <p className="text-sm text-slate-500">{t('performance.noFeedback')}</p>
        ) : (
          <ul className="space-y-3">
            {feedback.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {f.is_anonymous_display || (f.is_anonymous && !f.from_user)
                      ? t('performance.anonymousUser')
                      : (f.from_user?.name ?? '—')}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {f.rating.toFixed(1)} / 5
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{f.feedback_text}</p>
                <p className="mt-1 text-xs text-slate-500">{f.feedback_date}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
