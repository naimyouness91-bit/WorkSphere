import { useTranslation } from 'react-i18next'
import type { AppUser } from '../../types/userList'
import type { SkillFilters } from '../../types/skill'
import { SKILL_LEVEL_ORDER } from '../../utils/skillLevel'

interface Props {
  filters: SkillFilters
  users: AppUser[]
  showEmployeeFilter: boolean
  onChange: (filters: SkillFilters) => void
}

export default function SkillFiltersBar({
  filters,
  users,
  showEmployeeFilter,
  onChange,
}: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<SkillFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      {showEmployeeFilter && (
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('skills.filterEmployee')}
          </label>
          <select
            value={filters.employee_id}
            onChange={(e) => update({ employee_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('skills.allEmployees')}</option>
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
          {t('skills.filterLevel')}
        </label>
        <select
          value={filters.level}
          onChange={(e) => update({ level: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">{t('skills.allLevels')}</option>
          {SKILL_LEVEL_ORDER.map((level) => (
            <option key={level} value={level}>
              {t(`skills.levels.${level}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
