import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import BudgetFormModal from '../components/finance/BudgetFormModal'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  deleteBudget,
  fetchBudgets,
  fetchFinanceSummary,
  openBudgetForm,
  setBudgetFilters,
} from '../store/budgetsSlice'
import { emptyBudgetFilters } from '../types/budget'
import { formatMoney } from '../utils/currency'
import { exportBudgetsToExcel, exportBudgetsToPdf } from '../utils/exportFinance'

const BAR_COLORS = ['#6366f1', '#10b981']

export default function BudgetsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { items, status, filters, summary } = useAppSelector((s) => s.budgets)

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchBudgets(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    dispatch(fetchFinanceSummary())
  }, [dispatch])

  const barData =
    summary?.budget_usage_by_department.map((row) => ({
      name: row.department,
      allocated: row.allocated,
      spent: row.spent,
    })) ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('budgets.title')}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('budgets.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportBudgetsToExcel(items)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {t('budgets.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportBudgetsToPdf(items, t('budgets.title'))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {t('budgets.exportPdf')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(openBudgetForm(null))}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('budgets.newBudget')}
          </button>
        </div>
      </div>

      {summary && (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <KpiCard label={t('finance.kpiAllocated')} value={formatMoney(summary.kpis.total_budget_allocated)} accent="violet" />
          <KpiCard
            label={t('finance.kpiTotalExpenses')}
            value={formatMoney(summary.kpis.total_expenses)}
            accent="indigo"
          />
          <KpiCard label={t('finance.kpiRemaining')} value={formatMoney(summary.kpis.total_remaining_funds)} accent="emerald" />
        </section>
      )}

      {barData.length > 0 && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('budgets.chartUsage')}</h2>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatMoney(Number(v))} />
                <Legend />
                <Bar dataKey="allocated" name={t('budgets.allocated')} radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={`a-${i}`} fill={BAR_COLORS[0]} />
                  ))}
                </Bar>
                <Bar dataKey="spent" name={t('budgets.spent')} radius={[4, 4, 0, 0]}>
                  {barData.map((_, i) => (
                    <Cell key={`s-${i}`} fill={BAR_COLORS[1]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder={t('budgets.filterDepartment')}
          value={filters.department}
          onChange={(e) => dispatch(setBudgetFilters({ ...filters, department: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <select
          value={filters.period}
          onChange={(e) =>
            dispatch(
              setBudgetFilters({
                ...filters,
                period: e.target.value as typeof filters.period,
              }),
            )
          }
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="">{t('budgets.allPeriods')}</option>
          <option value="monthly">{t('budgets.periodMonthly')}</option>
          <option value="yearly">{t('budgets.periodYearly')}</option>
        </select>
        <button
          type="button"
          onClick={() => dispatch(setBudgetFilters(emptyBudgetFilters()))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
        >
          {t('common.clear')}
        </button>
      </div>

      {status === 'loading' && items.length === 0 ? (
        <div className="mt-8">
          <LoadingSpinner label={t('common.loading')} />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('budgets.department')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('budgets.period')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('budgets.allocated')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('budgets.spent')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('budgets.remaining')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('budgets.usage')}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">{t('finance.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {t('budgets.empty')}
                  </td>
                </tr>
              ) : (
                items.map((budget) => {
                  const usageColor =
                    budget.usage_percent >= 90
                      ? 'bg-red-500'
                      : budget.usage_percent >= 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'

                  return (
                    <tr key={budget.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{budget.department}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {t(`budgets.period${budget.period === 'monthly' ? 'Monthly' : 'Yearly'}`)} {budget.period_year}
                        {budget.period_month ? ` / ${budget.period_month}` : ''}
                      </td>
                      <td className="px-4 py-3 text-sm">{formatMoney(budget.allocated_amount)}</td>
                      <td className="px-4 py-3 text-sm">{formatMoney(budget.spent_amount)}</td>
                      <td className="px-4 py-3 text-sm">{formatMoney(budget.remaining_amount)}</td>
                      <td className="min-w-[160px] px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className={`h-full rounded-full ${usageColor}`}
                              style={{ width: `${Math.min(100, budget.usage_percent)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{budget.usage_percent}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => dispatch(openBudgetForm(budget))}
                            className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => dispatch(deleteBudget(budget.id))}
                            className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <BudgetFormModal />
    </div>
  )
}
