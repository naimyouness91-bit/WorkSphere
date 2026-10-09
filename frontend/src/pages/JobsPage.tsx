import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import JobFormModal from '../components/recruitment/JobFormModal'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  deleteJob,
  fetchJobs,
  openCreateJobForm,
  openEditJobForm,
  setJobFilters,
} from '../store/jobsSlice'

export default function JobsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters } = useAppSelector((s) => s.jobs)

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchJobs(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  const departments = useMemo(
    () => [...new Set(items.map((j) => j.department))].sort(),
    [items],
  )

  const displayJobs = isManager ? items : items.filter((j) => j.status === 'open')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('jobs.title')}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('jobs.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/applications"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-600"
          >
            {t('jobs.viewApplications')}
          </Link>
          {isManager && (
            <button
              type="button"
              onClick={() => dispatch(openCreateJobForm())}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('jobs.newJob')}
            </button>
          )}
        </div>
      </div>

      {isManager && (
        <div className="mt-6 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{t('jobs.filterDepartment')}</label>
            <select
              value={filters.department}
              onChange={(e) => dispatch(setJobFilters({ ...filters, department: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">{t('jobs.allDepartments')}</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">{t('jobs.filterStatus')}</label>
            <select
              value={filters.status}
              onChange={(e) => dispatch(setJobFilters({ ...filters, status: e.target.value }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              <option value="">{t('jobs.allStatuses')}</option>
              <option value="open">{t('jobs.status.open')}</option>
              <option value="closed">{t('jobs.status.closed')}</option>
            </select>
          </div>
        </div>
      )}

      {status === 'loading' ? (
        <p className="mt-8 text-center text-slate-500">{t('jobs.loading')}</p>
      ) : displayJobs.length === 0 ? (
        <p className="mt-8 text-center text-slate-500">{t('jobs.empty')}</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {displayJobs.map((job) => (
            <article
              key={job.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{job.title}</h2>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    job.status === 'open'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t(`jobs.status.${job.status}`)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{job.description}</p>
              <dl className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <div>
                  <dt className="font-medium text-slate-700 dark:text-slate-300">{t('jobs.department')}</dt>
                  <dd>{job.department}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700 dark:text-slate-300">{t('jobs.location')}</dt>
                  <dd>{job.location}</dd>
                </div>
                {isManager && job.applications_count !== undefined && (
                  <div>
                    <dt className="font-medium text-slate-700 dark:text-slate-300">{t('jobs.applications')}</dt>
                    <dd>{job.applications_count}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {job.status === 'open' && (
                  <Link
                    to="/applications"
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
                  >
                    {t('jobs.applyNow')}
                  </Link>
                )}
                {isManager && (
                  <>
                    <button
                      type="button"
                      onClick={() => dispatch(openEditJobForm(job))}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
                    >
                      {t('jobs.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(deleteJob(job.id))}
                      className="text-sm font-medium text-red-600 dark:text-red-400"
                    >
                      {t('common.delete')}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {isManager && <JobFormModal />}
    </div>
  )
}
