import { useTranslation } from 'react-i18next'
import type { ProjectFilters } from '../../types/project'

interface Props {
  filters: ProjectFilters
  onChange: (filters: ProjectFilters) => void
  showManagerFilter: boolean
  managers: { id: number; name: string }[]
}

export default function ProjectFiltersBar({ filters, onChange, showManagerFilter, managers }: Props) {
  const { t } = useTranslation()

  const update = (patch: Partial<ProjectFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('projects.search')}</label>
          <input
            type="search"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder={t('projects.searchPlaceholder')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('projects.statusLabel')}</label>
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">{t('projects.allStatuses')}</option>
            <option value="active">{t('projects.status.active')}</option>
            <option value="completed">{t('projects.status.completed')}</option>
            <option value="on_hold">{t('projects.status.on_hold')}</option>
          </select>
        </div>
        {showManagerFilter && (
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">{t('projects.manager')}</label>
            <select
              value={filters.manager_id}
              onChange={(e) => update({ manager_id: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">{t('projects.allManagers')}</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
