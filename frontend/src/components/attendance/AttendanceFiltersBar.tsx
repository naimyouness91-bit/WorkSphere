import { useTranslation } from 'react-i18next'
import type { AttendanceFilters } from '../../types/attendance'

interface Props {
  filters: AttendanceFilters
  onChange: (filters: AttendanceFilters) => void
  showEmployeeFilter: boolean
  users: { id: number; name: string }[]
}

export default function AttendanceFiltersBar({ filters, onChange, showEmployeeFilter, users }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<AttendanceFilters>) => onChange({ ...filters, ...patch })
  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-end gap-3">
        {showEmployeeFilter && (
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">{t('attendance.employee')}</label>
            <select
              value={filters.employee_id}
              onChange={(e) => update({ employee_id: e.target.value })}
              className={inputClass}
            >
              <option value="">{t('attendance.allEmployees')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('attendance.statusLabel')}</label>
          <select value={filters.status} onChange={(e) => update({ status: e.target.value })} className={inputClass}>
            <option value="">{t('attendance.allStatuses')}</option>
            <option value="present">{t('attendance.status.present')}</option>
            <option value="late">{t('attendance.status.late')}</option>
            <option value="absent">{t('attendance.status.absent')}</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('attendance.date')}</label>
          <input type="date" value={filters.date} onChange={(e) => update({ date: e.target.value })} className={inputClass} />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('attendance.dateFrom')}</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => update({ date_from: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('attendance.dateTo')}</label>
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
