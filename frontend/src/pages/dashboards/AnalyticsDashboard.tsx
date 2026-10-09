import { useEffect, useState } from 'react'
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
import KpiCard from '../../components/KpiCard'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useAppSelector } from '../../hooks/redux'
import { analyticsApi } from '../../services/analyticsApi'
import type { DashboardAnalytics } from '../../types/analytics'
import { getRoleLabel } from '../../utils/roles'
import { formatMoney } from '../../utils/currency'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
}

const TYPE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4']

function formatChartDate(date: string, locale: string): string {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

export default function AnalyticsDashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAppSelector((state) => state.auth)
  const [data, setData] = useState<DashboardAnalytics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi
      .get()
      .then((res) => setData(res.data.data))
      .catch(() => setError(t('dashboard.loadFailed')))
      .finally(() => setLoading(false))
  }, [t])

  const title =
    user?.role === 'admin'
      ? t('dashboard.adminTitle')
      : t('dashboard.managerTitle')

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-slate-600">{t('dashboard.overview')}</p>
        </header>
        <LoadingSpinner label={t('dashboard.loadingAnalytics')} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-center text-red-600">{error ?? t('dashboard.noData')}</p>
      </div>
    )
  }

  const lineData = data.requests_over_time.map((p) => ({
    ...p,
    label: formatChartDate(p.date, i18n.language),
  }))

  const statusData = data.requests_by_status.map((s) => ({
    name: t(`status.${s.status}`),
    value: s.count,
    status: s.status,
  }))

  const typeData = data.requests_by_type.map((item) => ({
    name: t(`requests.types.${item.type}`),
    count: item.count,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-8">
        <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-800">
          {user ? getRoleLabel(user.role) : t('nav.dashboard')}
        </span>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-1 text-slate-600">{t('dashboard.analyticsSubtitle')}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label={t('dashboard.totalEmployees')}
          value={data.kpis.total_employees}
          accent="indigo"
        />
        <KpiCard
          label={t('dashboard.totalRequests')}
          value={data.kpis.total_requests}
          accent="violet"
        />
        <KpiCard
          label={t('dashboard.acceptanceRate')}
          value={`${data.kpis.acceptance_rate}%`}
          subtext={t('dashboard.acceptanceSubtext')}
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.totalPayrollCost')}
          value={formatMoney(data.payroll_kpis.total_payroll_cost, i18n.language)}
          subtext={t('dashboard.payrollKpiSubtext')}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.averageSalary')}
          value={formatMoney(data.payroll_kpis.average_salary, i18n.language)}
          accent="violet"
        />
        <KpiCard
          label={t('dashboard.completedTrainings')}
          value={data.training_skills_kpis.completed_trainings}
          subtext={`/ ${data.training_skills_kpis.total_trainings} ${t('dashboard.totalTrainings')}`}
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.averageSkillLevel')}
          value={data.training_skills_kpis.average_skill_level.toFixed(2)}
          subtext={t('dashboard.skillLevelScale')}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.avgPerformanceScore')}
          value={data.evaluation_kpis.average_performance_score.toFixed(2)}
          subtext={t('dashboard.evaluationScale')}
          accent="indigo"
        />
        <KpiCard
          label={t('dashboard.topPerformers')}
          value={data.evaluation_kpis.top_performers[0]?.employee_name ?? '—'}
          subtext={
            data.evaluation_kpis.top_performers[0]
              ? `${data.evaluation_kpis.top_performers[0].average_score.toFixed(1)} / 5`
              : t('evaluations.noData')
          }
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.openJobs')}
          value={data.recruitment_kpis.open_jobs}
          accent="violet"
        />
        <KpiCard
          label={t('dashboard.applicationsReceived')}
          value={data.recruitment_kpis.applications_received}
          subtext={`${data.recruitment_kpis.pending_applications} ${t('dashboard.pending')}`}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.hires')}
          value={data.recruitment_kpis.hires}
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.activeProjects')}
          value={data.project_kpis.active_projects}
          accent="indigo"
        />
        <KpiCard
          label={t('dashboard.tasksCompleted')}
          value={data.project_kpis.tasks_completed}
          subtext={`/ ${data.project_kpis.total_tasks} ${t('dashboard.totalTasks')}`}
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.overdueTasks')}
          value={data.project_kpis.overdue_tasks}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.openTickets')}
          value={data.ticket_kpis.open_tickets}
          accent="indigo"
        />
        <KpiCard
          label={t('dashboard.avgResolutionTime')}
          value={`${data.ticket_kpis.average_resolution_hours}h`}
          subtext={`${data.ticket_kpis.total_tickets} ${t('dashboard.totalTickets')}`}
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.attendanceRate')}
          value={`${data.attendance_kpis.attendance_rate}%`}
          accent="emerald"
        />
        <KpiCard
          label={t('dashboard.avgWorkingHours')}
          value={data.attendance_kpis.average_working_hours}
          subtext={t('dashboard.perRecord')}
          accent="indigo"
        />
        <KpiCard
          label={t('dashboard.approvedLeaves')}
          value={data.attendance_kpis.approved_leaves_count}
          accent="amber"
        />
        <KpiCard
          label={t('dashboard.totalExpenses')}
          value={formatMoney(data.finance_kpis.total_expenses)}
          accent="indigo"
        />
        <KpiCard
          label={t('dashboard.budgetAllocated')}
          value={formatMoney(data.finance_kpis.total_budget_allocated)}
          accent="violet"
        />
        <KpiCard
          label={t('dashboard.remainingFunds')}
          value={formatMoney(data.finance_kpis.total_remaining_funds)}
          accent="emerald"
        />
        {user?.role === 'admin' && (
          <>
            <KpiCard
              label={t('dashboard.auditToday')}
              value={data.audit_kpis.actions_logged_today}
              accent="indigo"
            />
            <KpiCard
              label={t('dashboard.auditTopUser')}
              value={data.audit_kpis.most_active_users[0]?.name ?? '—'}
              subtext={
                data.audit_kpis.most_active_users[0]
                  ? `${data.audit_kpis.most_active_users[0].action_count} ${t('audit.actionsCount')}`
                  : undefined
              }
              accent="violet"
            />
            <KpiCard
              label={t('dashboard.auditTopModule')}
              value={
                data.audit_kpis.top_modules[0]
                  ? t(`audit.modules.${data.audit_kpis.top_modules[0].module}`, data.audit_kpis.top_modules[0].module)
                  : '—'
              }
              accent="amber"
            />
            <KpiCard
              label={t('dashboard.activeIntegrations')}
              value={data.integration_kpis.active_integrations}
              subtext={`/ ${data.integration_kpis.total_integrations}`}
              accent="indigo"
            />
            <KpiCard
              label={t('dashboard.integrationLastSync')}
              value={
                data.integration_kpis.last_sync_at
                  ? new Date(data.integration_kpis.last_sync_at).toLocaleString()
                  : t('integrations.never')
              }
              accent="emerald"
            />
          </>
        )}
      </section>

      {user?.role === 'admin' && data.security_alerts.length > 0 && (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-amber-900">{t('audit.securityAlerts')}</h2>
          <ul className="mt-2 space-y-1.5">
            {data.security_alerts.slice(0, 3).map((alert, i) => (
              <li key={i} className="text-sm text-amber-900">
                {alert.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800">
            {t('dashboard.requestsOverTime')}
          </h2>
          <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={t('dashboard.totalRequests')}
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800">
            {t('dashboard.requestsByStatus')}
          </h2>
          <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {data.expenses_by_category.length > 0 && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-800">{t('dashboard.expensesByCategory')}</h2>
            <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.expenses_by_category.map((row) => ({
                      name: t(`finance.category.${row.category}`),
                      value: row.total,
                      category: row.category,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${formatMoney(Number(value))}`}
                  >
                    {data.expenses_by_category.map((entry, index) => (
                      <Cell key={entry.category} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          {data.budget_usage_by_department.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold text-slate-800">{t('dashboard.budgetByDepartment')}</h2>
              <div className="mt-4 h-64 w-full min-w-0 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.budget_usage_by_department.map((row) => ({
                      name: row.department,
                      spent: row.spent,
                      allocated: row.allocated,
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Legend />
                    <Bar dataKey="allocated" name={t('budgets.allocated')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="spent" name={t('budgets.spent')} fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-800">
          {t('dashboard.requestsByType')}
        </h2>
        <div className="mt-4 h-72 w-full min-w-0 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={typeData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              />
              <Bar dataKey="count" name={t('dashboard.totalRequests')} radius={[6, 6, 0, 0]}>
                {typeData.map((_, index) => (
                  <Cell key={index} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
