import { useTranslation } from 'react-i18next'
import type { ApplicationFilters } from '../../types/application'
import type { Job } from '../../types/job'

interface Props {
  filters: ApplicationFilters
  jobs: Job[]
  departments: string[]
  showManagerFilters: boolean
  onChange: (filters: ApplicationFilters) => void
}

export default function ApplicationFiltersBar({
  filters,
  jobs,
  departments,
  showManagerFilters,
  onChange,
}: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<ApplicationFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      {showManagerFilters && (
        <div className="min-w-[140px] flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            {t('applications.filterDepartment')}
          </label>
          <select
            value={filters.department}
            onChange={(e) => update({ department: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">{t('applications.allDepartments')}</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="min-w-[160px] flex-1">
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('applications.filterJob')}
        </label>
        <select
          value={filters.job_id}
          onChange={(e) => update({ job_id: e.target.value })}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">{t('applications.allJobs')}</option>
          {jobs.map((j) => (
            <option key={j.id} value={String(j.id)}>
              {j.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
          {t('applications.filterStatus')}
        </label>
        <select
          value={filters.status}
          onChange={(e) => update({ status: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">{t('applications.allStatuses')}</option>
          <option value="applied">{t('recruitment.status.applied')}</option>
          <option value="shortlisted">{t('recruitment.status.shortlisted')}</option>
          <option value="interviewed">{t('recruitment.status.interviewed')}</option>
          <option value="hired">{t('recruitment.status.hired')}</option>
          <option value="rejected">{t('recruitment.status.rejected')}</option>
        </select>
      </div>
    </div>
  )
}
