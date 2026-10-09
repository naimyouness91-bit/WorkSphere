import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HeatmapRow } from '../../types/analyticsInsight'

interface Props {
  data: HeatmapRow[]
  onDrill?: (department: string) => void
}

function riskColor(score: number): string {
  if (score >= 70) return '#ef4444'
  if (score >= 40) return '#f59e0b'
  return '#10b981'
}

export default function DepartmentHeatmap({ data, onDrill }: Props) {
  const { t } = useTranslation()

  if (data.length === 0) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {t('analytics.heatmapTitle')}
      </h3>
      <p className="mt-1 text-xs text-slate-500">{t('analytics.heatmapHint')}</p>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="department" tick={{ fontSize: 10 }} width={75} />
            <Tooltip
              formatter={(v, name) => [
                name === 'risk_score' ? `${v}%` : v,
                t(`analytics.heatmap.${String(name)}`, String(name)),
              ]}
            />
            <Bar
              dataKey="risk_score"
              name="risk_score"
              radius={[0, 4, 4, 0]}
              cursor={onDrill ? 'pointer' : 'default'}
              onClick={(_data, index) => {
                const row = data[index]
                if (row?.department && onDrill) onDrill(row.department)
              }}
            >
              {data.map((entry) => (
                <Cell key={entry.department} fill={riskColor(entry.risk_score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
