import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import PayrollFiltersBar from '../components/payroll/PayrollFiltersBar'
import PayrollFormModal from '../components/payroll/PayrollFormModal'
import KpiCard from '../components/KpiCard'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { fetchEmployees } from '../store/employeesSlice'
import { addNotification } from '../store/notificationSlice'
import {
  fetchPayrollSummary,
  fetchPayrolls,
  openCreatePayrollForm,
  openEditPayrollForm,
  setPayrollFilters,
} from '../store/payrollsSlice'
import { exportPayrollToExcel, exportPayrollToPdf } from '../utils/exportPayroll'
import { formatMoney } from '../utils/currency'

export default function PayrollPage() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const { items: employees } = useAppSelector((state) => state.employees)
  const { items, status, error, filters, summary } = useAppSelector(
    (state) => state.payrolls,
  )

  const loadData = useCallback(() => {
    dispatch(fetchPayrolls(filters))
    dispatch(fetchPayrollSummary(filters))
  }, [dispatch, filters])

  useEffect(() => {
    dispatch(fetchEmployees())
  }, [dispatch])

  useEffect(() => {
    const timer = setTimeout(loadData, 200)
    return () => clearTimeout(timer)
  }, [loadData])

  useEffect(() => {
    if (status === 'failed' && error) {
      dispatch(addNotification({ type: 'error', message: error }))
    }
  }, [status, error, dispatch])

  const handleExportExcel = () => {
    exportPayrollToExcel(items, 'worksphere-payroll.xlsx')
  }

  const handleExportPdf = () => {
    exportPayrollToPdf(items, t('payroll.exportTitle'), 'worksphere-payroll.pdf')
  }

  const money = (n: number) => formatMoney(n, i18n.language)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {t('payroll.title')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('payroll.subtitle')}</p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            {t('payroll.confidentialNotice')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {t('payroll.exportExcel')}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          >
            {t('payroll.exportPdf')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(openCreatePayrollForm())}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            {t('payroll.addRecord')}
          </button>
        </div>
      </div>

      {summary && (
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <KpiCard
            label={t('payroll.kpiTotalCost')}
            value={money(summary.total_payroll_cost)}
            accent="violet"
          />
          <KpiCard
            label={t('payroll.kpiAverageSalary')}
            value={money(summary.average_salary)}
            accent="emerald"
          />
          <KpiCard
            label={t('payroll.kpiRecordCount')}
            value={summary.record_count}
            accent="indigo"
          />
        </section>
      )}

      <div className="mt-6">
        <PayrollFiltersBar
          filters={filters}
          employees={employees}
          onChange={(f) => dispatch(setPayrollFilters(f))}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {status === 'loading' ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('payroll.loading')}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('payroll.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('payroll.employee')}
                  </th>
                  <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('payroll.baseSalary')}
                  </th>
                  <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('payroll.bonuses')}
                  </th>
                  <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('payroll.deductions')}
                  </th>
                  <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('payroll.netSalary')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('payroll.payDate')}
                  </th>
                  <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    {t('payroll.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                      <div>{row.employee?.name ?? '—'}</div>
                      <div className="text-xs text-slate-500">{row.employee?.department}</div>
                    </td>
                    <td className="px-4 py-3 text-end text-sm tabular-nums text-slate-700 dark:text-slate-300">
                      {money(row.base_salary)}
                    </td>
                    <td className="px-4 py-3 text-end text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
                      {money(row.bonuses)}
                    </td>
                    <td className="px-4 py-3 text-end text-sm tabular-nums text-red-600 dark:text-red-400">
                      {money(row.deductions)}
                    </td>
                    <td className="px-4 py-3 text-end text-sm font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">
                      {money(row.net_salary)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {row.pay_date}
                    </td>
                    <td className="px-4 py-3 text-end">
                      <button
                        type="button"
                        onClick={() => dispatch(openEditPayrollForm(row))}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                      >
                        {t('payroll.edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PayrollFormModal employees={employees} />
    </div>
  )
}
