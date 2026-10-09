import { useTranslation } from 'react-i18next'
import type { AppUser } from '../../types/userList'
import type { TrainingFilters } from '../../types/training'

interface Props {
  filters: TrainingFilters
  users: AppUser[]
  showEmployeeFilter: boolean
  onChange: (filters: TrainingFilters) => void
}

export default function TrainingFiltersBar({
  filters,
  users,
  showEmployeeFilter,
  onChange,
}: Props) {
  const { t } = useTranslation()

  const update = (patch: Partial<TrainingFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      {showEmployeeFilter && (
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('training.filterEmployee')}
          </label>
          <select
            value={filters.employee_id}
            onChange={(e) => update({ employee_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('training.allEmployees')}</option>
            {users.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('training.filterStatus')}
        </label>
        <select
          value={filters.status}
          onChange={(e) => update({ status: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">{t('training.allStatuses')}</option>
          <option value="scheduled">{t('training.status.scheduled')}</option>
          <option value="completed">{t('training.status.completed')}</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('training.dateFrom')}
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
          {t('training.dateTo')}
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
