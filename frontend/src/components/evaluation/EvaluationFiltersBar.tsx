import { useTranslation } from 'react-i18next'
import type { AppUser } from '../../types/userList'
import type { EvaluationFilters } from '../../types/evaluation'

interface Props {
  filters: EvaluationFilters
  departments: string[]
  users: AppUser[]
  showManagerFilters: boolean
  onChange: (filters: EvaluationFilters) => void
}

export default function EvaluationFiltersBar({
  filters,
  departments,
  users,
  showManagerFilters,
  onChange,
}: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<EvaluationFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      {showManagerFilters && (
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('evaluations.filterDepartment')}
          </label>
          <select
            value={filters.department}
            onChange={(e) => update({ department: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('evaluations.allDepartments')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="min-w-[120px]">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('evaluations.reviewPeriod')}
        </label>
        <input
          type="text"
          placeholder="2026-Q1"
          value={filters.review_period}
          onChange={(e) => update({ review_period: e.target.value })}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      {showManagerFilters && (
        <>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('evaluations.filterStatus')}
            </label>
            <select
              value={filters.status}
              onChange={(e) => update({ status: e.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">{t('evaluations.allStatuses')}</option>
              <option value="draft">{t('evaluations.status.draft')}</option>
              <option value="submitted">{t('evaluations.status.submitted')}</option>
              <option value="finalized">{t('evaluations.status.finalized')}</option>
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('evaluations.filterEmployee')}
            </label>
            <select
              value={filters.employee_id}
              onChange={(e) => update({ employee_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">{t('evaluations.allEmployees')}</option>
              {users
                .filter((u) => u.role === 'employee')
                .map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
        </>
      )}
    </div>
  )
}
