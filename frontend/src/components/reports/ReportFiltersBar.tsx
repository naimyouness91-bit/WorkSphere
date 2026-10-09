import { useTranslation } from 'react-i18next'
import type { ReportFilters, ReportModule } from '../../types/report'

interface Props {
  filters: ReportFilters
  departments: string[]
  onChange: (filters: ReportFilters) => void
}

const MODULES: ReportModule[] = ['all', 'requests', 'payroll', 'attendance', 'finance', 'performance']

export default function ReportFiltersBar({ filters, departments, onChange }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<ReportFilters>) => onChange({ ...filters, ...patch })

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm dark:border-slate-700 dark:from-slate-900/80 dark:to-slate-900">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[150px] flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            {t('reports.module')}
          </label>
          <select
            value={filters.module}
            onChange={(e) => update({ module: e.target.value as ReportModule })}
            className={inputClass}
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {t(`reports.modules.${m}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[150px] flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            {t('reports.department')}
          </label>
          <select
            value={filters.department}
            onChange={(e) => update({ department: e.target.value })}
            className={inputClass}
          >
            <option value="">{t('reports.allDepartments')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px] flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            {t('reports.dateFrom')}
          </label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => update({ date_from: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="min-w-[140px] flex-1 sm:flex-none">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            {t('reports.dateTo')}
          </label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => update({ date_to: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}
