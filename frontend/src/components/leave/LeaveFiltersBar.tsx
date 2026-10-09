import { useTranslation } from 'react-i18next'
import type { LeaveFilters } from '../../types/leave'

interface Props {
  filters: LeaveFilters
  onChange: (filters: LeaveFilters) => void
  showEmployeeFilter: boolean
  users: { id: number; name: string }[]
}

export default function LeaveFiltersBar({ filters, onChange, showEmployeeFilter, users }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<LeaveFilters>) => onChange({ ...filters, ...patch })
  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-end gap-3">
        {showEmployeeFilter && (
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">{t('leaves.employee')}</label>
            <select
              value={filters.employee_id}
              onChange={(e) => update({ employee_id: e.target.value })}
              className={inputClass}
            >
              <option value="">{t('leaves.allEmployees')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('leaves.typeLabel')}</label>
          <select
            value={filters.leave_type}
            onChange={(e) => update({ leave_type: e.target.value })}
            className={inputClass}
          >
            <option value="">{t('leaves.allTypes')}</option>
            <option value="sick">{t('leaves.type.sick')}</option>
            <option value="vacation">{t('leaves.type.vacation')}</option>
            <option value="unpaid">{t('leaves.type.unpaid')}</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('leaves.statusLabel')}</label>
          <select value={filters.status} onChange={(e) => update({ status: e.target.value })} className={inputClass}>
            <option value="">{t('leaves.allStatuses')}</option>
            <option value="pending">{t('leaves.status.pending')}</option>
            <option value="approved">{t('leaves.status.approved')}</option>
            <option value="rejected">{t('leaves.status.rejected')}</option>
          </select>
        </div>
      </div>
    </div>
  )
}
