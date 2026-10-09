import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import * as XLSX from 'xlsx'
import BudgetOverview from '../components/finance/BudgetOverview'
import ExpenseFiltersBar from '../components/finance/ExpenseFiltersBar'
import ExpenseSubmitModal from '../components/finance/ExpenseSubmitModal'
import IncomeExpenseChart from '../components/finance/IncomeExpenseChart'
import InvoiceManager from '../components/finance/InvoiceManager'
import TransactionTable from '../components/finance/TransactionTable'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { accountingApi } from '../services/accountingApi'
import { crmApi } from '../services/crmApi'
import {
  fetchExpenses,
  openSubmitExpenseForm,
  setExpenseFilters,
  updateExpenseStatus,
} from '../store/expensesSlice'
import { fetchFinanceSummary } from '../store/budgetsSlice'
import type { AccountingOverview, FinancialTransaction, Invoice } from '../types/accounting'
import type { Expense } from '../types/expense'
import { EXPENSE_CATEGORY_STYLES, EXPENSE_STATUS_STYLES } from '../utils/expenseBadges'
import { formatMoney } from '../utils/currency'
import { exportExpensesToExcel, exportExpensesToPdf } from '../utils/exportFinance'

const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#94a3b8']
type Tab = 'overview' | 'expenses' | 'invoices' | 'transactions'

export default function FinancePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters } = useAppSelector((s) => s.expenses)
  const summary = useAppSelector((s) => s.budgets.summary)

  const isManager = user?.role === 'admin' || user?.role === 'manager'
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<AccountingOverview | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [clients, setClients] = useState<{ id: number; name: string; company: string }[]>([])
  const [loadingOverview, setLoadingOverview] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchExpenses(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    dispatch(fetchFinanceSummary())
    accountingApi
      .overview()
      .then((res) => setOverview(res.data.data))
      .finally(() => setLoadingOverview(false))
    if (isManager) {
      crmApi.clients().then((res) => setClients(res.data.data.map((c) => ({ id: c.id, name: c.name, company: c.company }))))
      accountingApi.getInvoices().then((res) => setInvoices(res.data.data))
      accountingApi.getTransactions().then((res) => setTransactions(res.data.data))
    }
  }, [dispatch, isManager])

  // Show the loading overlay again while a reload is in flight (adjust state
  // during render instead of setting it inside an effect).
  if (overview === null && !loadingOverview) {
    setLoadingOverview(true)
  }

  const reloadOverview = () => {
    accountingApi.overview().then((res) => setOverview(res.data.data))
    dispatch(fetchFinanceSummary())
    if (isManager) {
      accountingApi.getInvoices().then((res) => setInvoices(res.data.data))
      accountingApi.getTransactions().then((res) => setTransactions(res.data.data))
    }
  }

  const pieData =
    (overview?.expenses_by_category ?? summary?.expenses_by_category ?? []).map((row: { category: string; total: number }) => ({
      name: t(`finance.category.${row.category}`),
      value: row.total,
      category: row.category,
    }))

  const handleApprove = (expense: Expense) => {
    dispatch(updateExpenseStatus({ id: expense.id, data: { status: 'approved' } }))
    reloadOverview()
  }

  const handleReject = (expense: Expense) => {
    dispatch(updateExpenseStatus({ id: expense.id, data: { status: 'rejected' } }))
  }

  const exportAll = async () => {
    const { data } = await accountingApi.export()
    const sheet = XLSX.utils.json_to_sheet(data.data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Finance')
    XLSX.writeFile(wb, 'worksphere-finance.xlsx')
  }

  const kpis = overview?.kpis

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('finance.tabOverview') },
    { id: 'expenses', label: t('finance.tabExpenses') },
    ...(isManager
      ? [
          { id: 'invoices' as Tab, label: t('finance.tabInvoices') },
          { id: 'transactions' as Tab, label: t('finance.tabTransactions') },
        ]
      : []),
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-emerald-700 to-indigo-700 bg-clip-text text-3xl font-bold text-transparent dark:from-emerald-400 dark:to-indigo-400">
            {t('finance.titleAccounting')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {isManager ? t('finance.subtitleManagerAccounting') : t('finance.subtitleEmployee')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isManager && (
            <button
              type="button"
              onClick={() => void exportAll()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
            >
              {t('finance.exportAll')}
            </button>
          )}
          <button
            type="button"
            onClick={() => exportExpensesToExcel(items)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
          >
            {t('finance.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportExpensesToPdf(items, t('finance.title'))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
          >
            {t('finance.exportPdf')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(openSubmitExpenseForm())}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {t('finance.newExpense')}
          </button>
        </div>
      </div>

      {kpis && (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <KpiCard label={t('finance.kpiTotalExpensesAccounting')} value={formatMoney(kpis.total_expenses)} accent="indigo" />
          <KpiCard label={t('finance.kpiPendingInvoices')} value={kpis.pending_invoices} accent="amber" />
          <KpiCard
            label={t('finance.kpiBudgetUtilization')}
            value={`${kpis.budget_utilization}%`}
            subtext={t('finance.kpiOverdueInvoices', { count: kpis.overdue_invoices })}
            accent="emerald"
          />
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === x.id
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-slate-500'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {loadingOverview && tab === 'overview' ? (
        <div className="mt-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="mt-6">
          {tab === 'overview' && overview && (
            <div className="grid gap-6 lg:grid-cols-2">
              <BudgetOverview budgets={overview.budgets} />
              <IncomeExpenseChart income={overview.income_vs_expenses.income} expenses={overview.income_vs_expenses.expenses} />
              {pieData.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:col-span-2">
                  <h2 className="text-lg font-semibold">{t('finance.chartByCategory')}</h2>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
                          {pieData.map((entry: { category: string }, index: number) => (
                            <Cell key={entry.category} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatMoney(Number(v))} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              )}
            </div>
          )}

          {tab === 'expenses' && (
            <>
              <div className="mb-4">
                <ExpenseFiltersBar filters={filters} onChange={(f) => dispatch(setExpenseFilters(f))} />
              </div>
              {status === 'loading' && items.length === 0 ? (
                <LoadingSpinner label={t('common.loading')} />
              ) : (
                <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
                  <table className="min-w-full divide-y text-sm dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left">{t('finance.titleField')}</th>
                        {isManager && <th className="px-4 py-3 text-left">{t('finance.employee')}</th>}
                        <th className="px-4 py-3 text-left">{t('finance.categoryLabel')}</th>
                        <th className="px-4 py-3 text-left">{t('finance.amount')}</th>
                        <th className="px-4 py-3 text-left">{t('finance.date')}</th>
                        <th className="px-4 py-3 text-left">{t('finance.statusLabel')}</th>
                        {isManager && <th className="px-4 py-3 text-right">{t('finance.actions')}</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {items.map((expense) => (
                        <tr key={expense.id}>
                          <td className="px-4 py-3 font-medium">{expense.title}</td>
                          {isManager && <td className="px-4 py-3">{expense.employee?.name ?? '—'}</td>}
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${EXPENSE_CATEGORY_STYLES[expense.category]}`}>
                              {t(`finance.category.${expense.category}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatMoney(expense.amount)}</td>
                          <td className="px-4 py-3">{expense.date}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${EXPENSE_STATUS_STYLES[expense.status]}`}>
                              {t(`finance.status.${expense.status}`)}
                            </span>
                          </td>
                          {isManager && (
                            <td className="px-4 py-3 text-right">
                              {expense.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                  <button type="button" onClick={() => handleApprove(expense)} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">
                                    {t('finance.approve')}
                                  </button>
                                  <button type="button" onClick={() => handleReject(expense)} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
                                    {t('finance.reject')}
                                  </button>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'invoices' && isManager && (
            <InvoiceManager
              invoices={invoices}
              canManage={isManager}
              clients={clients}
              onCreate={async (payload) => {
                await accountingApi.createInvoice(payload)
                reloadOverview()
              }}
              onStatusChange={async (id, st) => {
                await accountingApi.updateInvoiceStatus(id, st)
                reloadOverview()
              }}
            />
          )}

          {tab === 'transactions' && isManager && <TransactionTable transactions={transactions} />}
        </div>
      )}

      <ExpenseSubmitModal />
    </div>
  )
}
