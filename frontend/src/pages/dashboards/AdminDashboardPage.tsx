import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ActivityTimeline from '../../components/admin/ActivityTimeline'
import DevOpsPanel from '../../components/admin/DevOpsPanel'
import DashboardNotificationsPanel from '../../components/admin/DashboardNotificationsPanel'
import RequestFiltersBar from '../../components/admin/RequestFiltersBar'
import ThemeToggle from '../../components/admin/ThemeToggle'
import KpiCard from '../../components/KpiCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import { useTheme } from '../../context/theme'
import { adminDashboardApi } from '../../services/adminDashboardApi'
import type { AdminOverview, RequestFilters } from '../../types/adminDashboard'
import { emptyRequestFilters } from '../../types/adminDashboard'
import type { InternalRequest } from '../../types/internalRequest'
import { getChartTheme } from '../../utils/chartTheme'
import {
  exportRequestsToExcel,
  exportRequestsToPdf,
  exportStatsToExcel,
  exportStatsToPdf,
} from '../../utils/exportDashboard'
import { formatMoney } from '../../utils/currency'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
}

const ENGAGEMENT_COLORS = { admin: '#6366f1', manager: '#8b5cf6', employee: '#06b6d4' }
const TYPE_BAR_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4']

function formatChartDate(date: string, locale: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation()
  const { isDark } = useTheme()
  const chartTheme = getChartTheme(isDark)

  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [requests, setRequests] = useState<InternalRequest[]>([])
  const [filters, setFilters] = useState<RequestFilters>(emptyRequestFilters())
  const [engagementPeriod, setEngagementPeriod] = useState<'day' | 'week'>('week')
  const [loading, setLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOverview = useCallback(() => {
    adminDashboardApi
      .overview(engagementPeriod)
      .then((res) => setOverview(res.data.data))
      .catch(() => setError(t('dashboard.loadFailed')))
      .finally(() => setLoading(false))
  }, [engagementPeriod, t])

  // Show the full-page loader whenever a new engagement period is selected
  // (adjust state during render instead of setting it inside an effect).
  const [prevPeriod, setPrevPeriod] = useState(engagementPeriod)
  if (prevPeriod !== engagementPeriod) {
    setPrevPeriod(engagementPeriod)
    setLoading(true)
    setError(null)
  }

  const loadRequests = useCallback(() => {
    setRequestsLoading(true)
    adminDashboardApi
      .requests(filters)
      .then((res) => setRequests(res.data.data))
      .finally(() => setRequestsLoading(false))
  }, [filters])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    const timer = setTimeout(loadRequests, 300)
    return () => clearTimeout(timer)
  }, [loadRequests])

  const analytics = overview?.analytics

  const handleExportRequestsExcel = () => {
    exportRequestsToExcel(requests)
  }

  const handleExportRequestsPdf = () => {
    exportRequestsToPdf(requests, t('adminDashboard.exportRequestsTitle'))
  }

  const handleExportStatsExcel = () => {
    if (analytics) {
      exportStatsToExcel(analytics)
    }
  }

  const handleExportStatsPdf = () => {
    if (analytics) {
      exportStatsToPdf(analytics, t('adminDashboard.exportStatsTitle'))
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <LoadingSpinner label={t('dashboard.loadingAnalytics')} />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-center text-red-600">{error ?? t('dashboard.noData')}</p>
      </div>
    )
  }

  const lineData = analytics.requests_over_time.map((p) => ({
    ...p,
    label: formatChartDate(p.date, i18n.language),
  }))

  const statusData = analytics.requests_by_status.map((s) => ({
    name: t(`status.${s.status}`),
    value: s.count,
    status: s.status,
  }))

  const typeData = analytics.requests_by_type.map((item) => ({
    name: t(`requests.types.${item.type}`),
    count: item.count,
  }))

  const engagementData = analytics.user_engagement.map((p) => ({
    ...p,
    label: formatChartDate(p.date, i18n.language),
  }))

  const panelClass =
    'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-900/50 dark:text-violet-200">
            {t('roles.admin')}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
            {t('dashboard.adminTitle')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {t('adminDashboard.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleExportStatsExcel}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {t('adminDashboard.exportStatsExcel')}
          </button>
          <button
            type="button"
            onClick={handleExportStatsPdf}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {t('adminDashboard.exportStatsPdf')}
          </button>
        </div>
      </header>

      {overview?.devops && (
        <section className={`${panelClass} mb-8`}>
          <DevOpsPanel
            initialMetrics={overview.devops.metrics}
            initialDeployments={overview.devops.recent_deployments}
          />
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8">
        <KpiCard label={t('dashboard.totalEmployees')} value={analytics.kpis.total_employees} accent="indigo" />
        <KpiCard label={t('dashboard.totalRequests')} value={analytics.kpis.total_requests} accent="violet" />
        <KpiCard
          label={t('dashboard.acceptanceRate')}
          value={`${analytics.kpis.acceptance_rate}%`}
          subtext={t('dashboard.acceptanceSubtext')}
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.totalPayrollCost')}
          value={formatMoney(analytics.payroll_kpis.total_payroll_cost, i18n.language)}
          subtext={t('dashboard.payrollKpiSubtext')}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.averageSalary')}
          value={formatMoney(analytics.payroll_kpis.average_salary, i18n.language)}
          accent="violet"
        />
        <KpiCard
          label={t('dashboard.completedTrainings')}
          value={analytics.training_skills_kpis.completed_trainings}
          subtext={`/ ${analytics.training_skills_kpis.total_trainings}`}
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.averageSkillLevel')}
          value={analytics.training_skills_kpis.average_skill_level.toFixed(2)}
          subtext={t('dashboard.skillLevelScale')}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.avgPerformanceScore')}
          value={analytics.evaluation_kpis.average_performance_score.toFixed(2)}
          subtext={t('dashboard.evaluationScale')}
          accent="indigo"
        />
        <KpiCard
          label={t('dashboard.topPerformers')}
          value={analytics.evaluation_kpis.top_performers[0]?.employee_name ?? '—'}
          subtext={
            analytics.evaluation_kpis.top_performers[0]
              ? String(analytics.evaluation_kpis.top_performers[0].average_score)
              : '—'
          }
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.openJobs')}
          value={analytics.recruitment_kpis.open_jobs}
          accent="violet"
        />
        <KpiCard
          label={t('dashboard.applicationsReceived')}
          value={analytics.recruitment_kpis.applications_received}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.hires')}
          value={analytics.recruitment_kpis.hires}
          accent="emerald"
        />
        <KpiCard
          label={t('adminDashboard.avgApprovalTime')}
          value={`${analytics.extended_kpis.avg_approval_time_hours}h`}
          accent="amber"
        />
        <KpiCard
          label={t('adminDashboard.rejectionRate')}
          value={`${analytics.extended_kpis.rejection_rate}%`}
          accent="amber"
        />
        <KpiCard
          label={t('adminDashboard.activeManagers')}
          value={`${analytics.extended_kpis.active_managers}/${analytics.extended_kpis.total_managers}`}
          accent="indigo"
        />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className={panelClass}>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t('dashboard.requestsOverTime')}
              </h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTheme.axis }} />
                    <YAxis tick={{ fontSize: 11, fill: chartTheme.axis }} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={panelClass}>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t('dashboard.requestsByStatus')}
              </h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} label>
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={`grid gap-6 lg:grid-cols-2 ${panelClass}`}>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                {t('dashboard.requestsByType')}
              </h2>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.axis }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTheme.axis }} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {typeData.map((_, index) => (
                        <Cell key={index} fill={TYPE_BAR_COLORS[index % TYPE_BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {t('adminDashboard.userEngagement')}
                </h2>
                <select
                  value={engagementPeriod}
                  onChange={(e) => setEngagementPeriod(e.target.value as 'day' | 'week')}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="week">{t('adminDashboard.last4Weeks')}</option>
                  <option value="day">{t('adminDashboard.last7Days')}</option>
                </select>
              </div>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: chartTheme.axis }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTheme.axis }} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Legend />
                    <Bar dataKey="admin" name={t('roles.admin')} fill={ENGAGEMENT_COLORS.admin} stackId="a" />
                    <Bar dataKey="manager" name={t('roles.manager')} fill={ENGAGEMENT_COLORS.manager} stackId="a" />
                    <Bar dataKey="employee" name={t('roles.employee')} fill={ENGAGEMENT_COLORS.employee} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <DashboardNotificationsPanel />
          <ActivityTimeline items={overview.activity} />
        </div>
      </section>

      <section className={`mt-8 ${panelClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {t('adminDashboard.requestsTable')}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportRequestsExcel}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              {t('adminDashboard.exportExcel')}
            </button>
            <button
              type="button"
              onClick={handleExportRequestsPdf}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              {t('adminDashboard.exportPdf')}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <RequestFiltersBar filters={filters} onChange={setFilters} />
        </div>
        <div className="mt-6 overflow-x-auto">
          {requestsLoading ? (
            <p className="py-8 text-center text-slate-500">{t('common.loading')}</p>
          ) : requests.length === 0 ? (
            <p className="py-8 text-center text-slate-500">{t('requests.empty')}</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('requests.titleField')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('requests.employee')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('requests.type')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('home.status')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('requests.submitted')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {req.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      <div>{req.employee?.name}</div>
                      <div className="text-xs text-slate-400">{req.employee?.email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {t(`requests.types.${req.type}`)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(req.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
