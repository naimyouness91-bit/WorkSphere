import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTranslation } from 'react-i18next'
import { formatMoney } from '../../utils/currency'

interface Props {
  income: number
  expenses: number
}

export default function IncomeExpenseChart({ income, expenses }: Props) {
  const { t } = useTranslation()
  const data = [
    { name: t('finance.income'), value: income, fill: '#10b981' },
    { name: t('finance.expensesLabel'), value: expenses, fill: '#6366f1' },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('finance.chartIncomeVsExpenses')}</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(v) => formatMoney(Number(v))} />
            <Legend />
            <Bar dataKey="value" name={t('finance.amount')} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
