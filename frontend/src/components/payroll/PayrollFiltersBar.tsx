import { useTranslation } from 'react-i18next'
import type { Employee } from '../../types/employee'
import type { PayrollFilters } from '../../types/payroll'

interface Props {
  filters: PayrollFilters
  employees: Employee[]
  onChange: (filters: PayrollFilters) => void
}

export default function PayrollFiltersBar({ filters, employees, onChange }: Props) {
  const { t } = useTranslation()

  const update = (patch: Partial<PayrollFilters>) => {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('payroll.filterEmployee')}
        </label>
        <select
          value={filters.employee_id}
          onChange={(e) => update({ employee_id: e.target.value })}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">{t('payroll.allEmployees')}</option>
          {employees.map((emp) => (
            <option key={emp.id} value={String(emp.id)}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('payroll.dateFrom')}
        </label>
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => update({ date_from: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('payroll.dateTo')}
        </label>
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => update({ date_to: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
    </div>
  )
}
