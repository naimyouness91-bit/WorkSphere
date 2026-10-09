import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import type { SecurityOverview } from '../../types/security'

const SEVERITY_COLORS: Record<string, string> = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#ef4444',
}

interface Props {
  overview: SecurityOverview
}

export default function SecurityCharts({ overview }: Props) {
  const { t } = useTranslation()

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t('security.chartAlertsBySeverity')}
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={overview.alerts_by_severity}
                dataKey="count"
                nameKey="severity"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(props) => {
                  const severity = String(props.name ?? props.payload?.severity ?? '')
                  const count = Number(props.value ?? 0)
                  return `${t(`security.severity.${severity}`, severity)}: ${count}`
                }}
              >
                {overview.alerts_by_severity.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] ?? '#6366f1'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t('security.chartActionsByModule')}
        </h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview.actions_by_module.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="module"
                tickFormatter={(v: string) => String(t(`audit.modules.${v}`, v))}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(v) => String(t(`audit.modules.${String(v)}`, String(v)))}
              />
              <Bar dataKey="count" name={t('security.actionsCount')} fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
