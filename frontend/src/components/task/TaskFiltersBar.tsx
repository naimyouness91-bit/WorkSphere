import { useTranslation } from 'react-i18next'
import type { Project } from '../../types/project'
import type { TaskFilters } from '../../types/task'

interface Props {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
  projects: Project[]
  showAssigneeFilter: boolean
  users: { id: number; name: string }[]
}

export default function TaskFiltersBar({
  filters,
  onChange,
  projects,
  showAssigneeFilter,
  users,
}: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<TaskFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('tasks.project')}</label>
          <select
            value={filters.project_id}
            onChange={(e) => update({ project_id: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">{t('tasks.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('tasks.statusLabel')}</label>
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">{t('tasks.allStatuses')}</option>
            <option value="pending">{t('tasks.status.pending')}</option>
            <option value="in_progress">{t('tasks.status.in_progress')}</option>
            <option value="done">{t('tasks.status.done')}</option>
          </select>
        </div>
        {showAssigneeFilter && (
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">{t('tasks.assignee')}</label>
            <select
              value={filters.assigned_to}
              onChange={(e) => update({ assigned_to: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">{t('tasks.allAssignees')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={filters.overdue_only}
            onChange={(e) => update({ overdue_only: e.target.checked })}
            className="rounded border-slate-300"
          />
          {t('tasks.overdueOnly')}
        </label>
      </div>
    </div>
  )
}
