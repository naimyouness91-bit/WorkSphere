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
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { fetchDrillDown } from '../../store/reportsSlice'
import type { ReportStatistics } from '../../types/report'
import { formatMoney } from '../../utils/currency'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  present: '#10b981',
  absent: '#ef4444',
  late: '#f59e0b',
}

interface Props {
  statistics: ReportStatistics
}

export default function ReportCharts({ statistics }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { filters } = useAppSelector((s) => s.reports)

  const drill = (module: string, segment: string, label: string) => {
    dispatch(fetchDrillDown({ module, segment, label, filters }))
  }

  const cardClass =
    'rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5'

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {statistics.requests && (
        <>
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('reports.requestsOverTime')}</h3>
            <div className="mt-3 h-56 w-full min-w-0 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statistics.requests.over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4, cursor: 'pointer' }}
                    onClick={(d) => {
                      const p = d as { month?: string }
                      if (p.month) drill('requests', p.month, `${t('reports.requestsOverTime')}: ${p.month}`)
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('reports.requestsByStatus')}</h3>
            <div className="mt-3 h-56 w-full min-w-0 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.requests.by_status.map((s) => ({
                      name: t(`status.${s.status}`, s.status),
                      value: s.count,
                      status: s.status,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={2}
                    cursor="pointer"
                    onClick={(_, index) => {
                      const item = statistics.requests!.by_status[index]
                      drill('requests', item.status, item.status)
                    }}
                  >
                    {statistics.requests.by_status.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? COLORS[0]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {statistics.payroll && (
        <>
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('reports.payrollEvolution')}</h3>
            <div className="mt-3 h-56 w-full min-w-0 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.payroll.evolution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Bar
                    dataKey="total"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(d) => {
                      const p = d as { month?: string }
                      if (p.month) drill('payroll', p.month, p.month)
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('reports.payrollByDept')}</h3>
            <div className="mt-3 h-56 w-full min-w-0 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.payroll.by_department} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="department" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Bar
                    dataKey="total"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(d) => {
                      const p = d as { department?: string }
                      if (p.department) drill('payroll', p.department, p.department)
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {statistics.attendance && (
        <div className={`${cardClass} lg:col-span-2`}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('reports.attendanceTrend')}</h3>
          <div className="mt-3 h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statistics.attendance.over_time}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rate" name={t('reports.attendanceRate')} stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="present" name={t('reports.present')} stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {statistics.finance && (
        <>
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('reports.expensesByCategory')}</h3>
            <div className="mt-3 h-56 w-full min-w-0 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statistics.finance.expenses_by_category.map((c) => ({
                      name: t(`finance.category.${c.category}`, c.category),
                      value: c.total,
                      category: c.category,
                    }))}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={85}
                    cursor="pointer"
                    onClick={(_, i) => {
                      const cat = statistics.finance!.expenses_by_category[i]
                      drill('finance', cat.category, cat.category)
                    }}
                  >
                    {statistics.finance.expenses_by_category.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={cardClass}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('reports.budgetUsage')}</h3>
            <div className="mt-6 flex flex-col items-center">
              <div className="relative h-40 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: t('budgets.spent'), value: statistics.finance.budget.spent },
                        {
                          name: t('budgets.remaining'),
                          value: statistics.finance.budget.remaining,
                        },
                      ]}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={75}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#6366f1" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">
                    {statistics.finance.budget.usage_percent}%
                  </span>
                  <span className="text-xs text-slate-500">{t('reports.used')}</span>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {formatMoney(statistics.finance.budget.spent)} / {formatMoney(statistics.finance.budget.allocated)}
              </p>
            </div>
          </div>
        </>
      )}

      {statistics.performance && (
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('reports.scoreDistribution')}</h3>
          <div className="mt-3 h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statistics.performance.score_distribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(d) => {
                    const p = d as { range?: string }
                    if (p.range) drill('performance', `range_${p.range}`, p.range)
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {statistics.comparative?.performance_vs_attendance &&
        statistics.comparative.performance_vs_attendance.length > 0 && (
          <div className={`${cardClass} lg:col-span-2`}>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t('reports.performanceVsAttendance')}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{t('reports.comparativeHint')}</p>
            <div className="mt-3 h-64 w-full min-w-0 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="attendance_rate"
                    name={t('reports.attendanceRate')}
                    unit="%"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="performance_score"
                    name={t('reports.performanceScore')}
                    tick={{ fontSize: 10 }}
                  />
                  <ZAxis range={[60, 200]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter
                    name={t('reports.employees')}
                    data={statistics.comparative.performance_vs_attendance}
                    fill="#6366f1"
                    cursor="pointer"
                    onClick={(d) => {
                      const p = d as { employee_id?: number; name?: string }
                      if (p.employee_id) drill('performance', String(p.employee_id), p.name ?? '')
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
    </div>
  )
}
