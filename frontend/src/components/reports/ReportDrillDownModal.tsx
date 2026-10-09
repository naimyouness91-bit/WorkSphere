import { useTranslation } from 'react-i18next'
import LoadingSpinner from '../LoadingSpinner'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeDrillDown } from '../../store/reportsSlice'
import { exportDrillDownToExcel } from '../../utils/exportReports'

export default function ReportDrillDownModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isDrillDownOpen, drillDown, drillDownStatus } = useAppSelector((s) => s.reports)

  if (!isDrillDownOpen) return null

  const items = drillDown?.items ?? []
  const columns = items.length > 0 ? Object.keys(items[0]).filter((k) => k !== 'id') : []

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-t-2xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('reports.drillDownTitle')}</h2>
            <p className="text-sm text-slate-500">{drillDown?.label}</p>
          </div>
          <div className="flex gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => exportDrillDownToExcel(items)}
                className="rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-600"
              >
                {t('reports.exportExcel')}
              </button>
            )}
            <button
              type="button"
              onClick={() => dispatch(closeDrillDown())}
              className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              ×
            </button>
          </div>
        </div>
        <div className="overflow-auto p-4">
          {drillDownStatus === 'loading' ? (
            <LoadingSpinner label={t('common.loading')} />
          ) : items.length === 0 ? (
            <p className="text-center text-slate-500">{t('reports.drillDownEmpty')}</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-slate-500">
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {String(row[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
