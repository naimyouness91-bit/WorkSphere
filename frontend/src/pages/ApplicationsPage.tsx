import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ApplicationApplyForm from '../components/recruitment/ApplicationApplyForm'
import ApplicationFiltersBar from '../components/recruitment/ApplicationFiltersBar'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { applicationsApi } from '../services/applicationsApi'
import {
  deleteApplication,
  fetchApplications,
  setApplicationFilters,
  updateApplicationStatus,
} from '../store/applicationsSlice'
import { fetchJobs } from '../store/jobsSlice'
import type { ApplicationStatus } from '../types/application'
import { exportApplicationsToExcel, exportApplicationsToPdf } from '../utils/exportApplications'

const STATUS_STYLES: Record<string, string> = {
  applied: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  shortlisted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  interviewed: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  hired: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
}

export default function ApplicationsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters } = useAppSelector((s) => s.applications)
  const { items: jobs } = useAppSelector((s) => s.jobs)

  const isManager = user?.role === 'admin' || user?.role === 'manager'
  const openJobs = useMemo(() => jobs.filter((j) => j.status === 'open'), [jobs])

  useEffect(() => {
    dispatch(fetchJobs({ department: '', status: isManager ? '' : 'open' }))
  }, [dispatch, isManager])

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchApplications(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  const departments = useMemo(
    () => [...new Set(jobs.map((j) => j.department))].sort(),
    [jobs],
  )

  const handleDownloadResume = async (id: number, filename: string) => {
    const { data } = await applicationsApi.downloadResume(id)
    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {t('applications.title')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {isManager ? t('applications.subtitleManager') : t('applications.subtitleCandidate')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/jobs" className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">
            {t('applications.browseJobs')}
          </Link>
          {isManager && (
            <>
              <button
                type="button"
                onClick={() => exportApplicationsToExcel(items)}
                disabled={items.length === 0}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600"
              >
                {t('applications.exportExcel')}
              </button>
              <button
                type="button"
                onClick={() => exportApplicationsToPdf(items, t('applications.exportTitle'))}
                disabled={items.length === 0}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-slate-600"
              >
                {t('applications.exportPdf')}
              </button>
            </>
          )}
        </div>
      </div>

      {!isManager && (
        <div className="mt-6">
          <ApplicationApplyForm openJobs={openJobs} />
        </div>
      )}

      <div className="mt-6">
        <ApplicationFiltersBar
          filters={filters}
          jobs={jobs}
          departments={departments}
          showManagerFilters={isManager}
          onChange={(f) => dispatch(setApplicationFilters(f))}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {status === 'loading' ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('applications.loading')}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('applications.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('applications.candidate')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('applications.position')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('applications.statusLabel')}
                  </th>
                  <th className="px-4 py-3 text-start text-xs font-semibold uppercase text-slate-600">
                    {t('applications.resume')}
                  </th>
                  {isManager && (
                    <th className="px-4 py-3 text-end text-xs font-semibold uppercase text-slate-600">
                      {t('applications.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{app.candidate_name}</div>
                      <div className="text-xs text-slate-500">{app.candidate_email}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div>{app.job?.title ?? '—'}</div>
                      <div className="text-xs text-slate-500">{app.job?.department}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isManager ? (
                        <select
                          value={app.status}
                          onChange={(e) =>
                            dispatch(
                              updateApplicationStatus({
                                id: app.id,
                                status: e.target.value as ApplicationStatus,
                              }),
                            )
                          }
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                        >
                          <option value="applied">{t('recruitment.status.applied')}</option>
                          <option value="shortlisted">{t('recruitment.status.shortlisted')}</option>
                          <option value="interviewed">{t('recruitment.status.interviewed')}</option>
                          <option value="hired">{t('recruitment.status.hired')}</option>
                          <option value="rejected">{t('recruitment.status.rejected')}</option>
                        </select>
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[app.status]}`}>
                          {t(`recruitment.status.${app.status}`, {
                            defaultValue: app.status,
                          })}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDownloadResume(app.id, app.original_resume_filename)}
                        className="text-sm text-indigo-600 dark:text-indigo-400"
                      >
                        {app.original_resume_filename}
                      </button>
                    </td>
                    {isManager && (
                      <td className="px-4 py-3 text-end">
                        <button
                          type="button"
                          onClick={() => dispatch(deleteApplication(app.id))}
                          className="text-sm font-medium text-red-600 dark:text-red-400"
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
