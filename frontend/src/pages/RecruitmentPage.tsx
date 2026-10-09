import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CandidatePipeline from '../components/recruitment/CandidatePipeline'
import ResumePreviewModal from '../components/recruitment/ResumePreviewModal'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppSelector } from '../hooks/redux'
import { recruitmentApi } from '../services/recruitmentApi'
import type {
  Candidate,
  CandidateStatus,
  JobPosting,
  OnboardingTask,
  RecruitmentOverview,
} from '../types/recruitment'
import {
  exportCandidatesToCsv,
  exportCandidatesToExcel,
  type ExportCandidateRow,
} from '../utils/exportRecruitment'

export default function RecruitmentPage() {
  const { t } = useTranslation()
  const { user } = useAppSelector((s) => s.auth)
  const isManager = user?.role === 'admin' || user?.role === 'manager'

  const [overview, setOverview] = useState<RecruitmentOverview | null>(null)
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [jobFilter, setJobFilter] = useState<number | ''>('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState('')

  const [showJobForm, setShowJobForm] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [jobReq, setJobReq] = useState('')
  const [jobDept, setJobDept] = useState('')
  const [jobLocation, setJobLocation] = useState('On-site')

  const load = useCallback(() => {
    Promise.all([
      recruitmentApi.overview(),
      recruitmentApi.jobPostings({
        department: deptFilter || undefined,
        status: statusFilter || undefined,
      }),
      recruitmentApi.candidates(jobFilter ? { job_id: jobFilter } : undefined),
      recruitmentApi.onboardingTasks(isManager ? undefined : user?.id),
    ])
      .then(([ov, jp, cand, onboard]) => {
        setOverview(ov.data.data)
        setJobs(jp.data.data)
        setCandidates(cand.data.data)
        setTasks(onboard.data.data)
      })
      .finally(() => setLoading(false))
  }, [deptFilter, statusFilter, jobFilter, isManager, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const handleStatusChange = (id: number, status: CandidateStatus) => {
    recruitmentApi.updateCandidateStatus(id, status).then(() => load())
  }

  const handlePreview = async (candidate: Candidate) => {
    try {
      const res = await recruitmentApi.previewResume(candidate.id)
      const url = URL.createObjectURL(res.data)
      setPreviewUrl(url)
      setPreviewName(candidate.original_resume_filename)
    } catch {
      const res = await recruitmentApi.downloadResume(candidate.id)
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    }
  }

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const res = await recruitmentApi.exportCandidates(jobFilter || undefined)
    const rows = res.data.data as unknown as ExportCandidateRow[]
    if (format === 'csv') exportCandidatesToCsv(rows)
    else exportCandidatesToExcel(rows)
  }

  const submitJob = (e: React.FormEvent) => {
    e.preventDefault()
    recruitmentApi
      .addJobPosting({
        title: jobTitle,
        description: jobDesc,
        requirements: jobReq || undefined,
        department: jobDept,
        location: jobLocation,
      })
      .then(() => {
        setShowJobForm(false)
        setJobTitle('')
        setJobDesc('')
        setJobReq('')
        setJobDept('')
        load()
      })
  }

  const completeTask = (id: number) => {
    recruitmentApi.completeOnboardingTask(id).then(() => load())
  }

  if (loading && !overview) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <LoadingSpinner label={t('recruitment.loading')} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-800 via-rose-700 to-slate-900 p-6 text-white shadow-lg dark:border-rose-900">
        <h1 className="text-2xl font-bold tracking-tight">{t('recruitment.title')}</h1>
        <p className="mt-2 text-rose-100">{t('recruitment.subtitle')}</p>
      </header>

      {overview && (
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <KpiCard
            label={t('recruitment.kpiOpenPositions')}
            value={overview.stats.open_positions}
            accent="rose"
          />
          <KpiCard
            label={t('recruitment.kpiPipeline')}
            value={overview.stats.candidates_in_pipeline}
            accent="indigo"
          />
          <KpiCard
            label={t('recruitment.kpiOnboarding')}
            value={overview.stats.onboarding_tasks_pending}
            accent="amber"
          />
        </section>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('recruitment.allDepartments')}</option>
          {overview?.departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('recruitment.openOnly')}</option>
          <option value="open">{t('recruitment.statusOpen')}</option>
          <option value="closed">{t('recruitment.statusClosed')}</option>
        </select>
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value ? Number(e.target.value) : '')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('recruitment.allJobs')}</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        {isManager && (
          <>
            <button
              type="button"
              onClick={() => setShowJobForm((v) => !v)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
            >
              {t('recruitment.addJob')}
            </button>
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="rounded-lg bg-rose-700 px-3 py-2 text-sm text-white"
            >
              {t('recruitment.exportExcel')}
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white"
            >
              {t('recruitment.exportCsv')}
            </button>
          </>
        )}
      </div>

      {showJobForm && isManager && (
        <form onSubmit={submitJob} className="mb-6 space-y-3 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <input
            required
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder={t('recruitment.jobTitle')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <textarea
            required
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder={t('recruitment.jobDescription')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <textarea
            value={jobReq}
            onChange={(e) => setJobReq(e.target.value)}
            placeholder={t('recruitment.jobRequirements')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            required
            value={jobDept}
            onChange={(e) => setJobDept(e.target.value)}
            placeholder={t('recruitment.department')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            value={jobLocation}
            onChange={(e) => setJobLocation(e.target.value)}
            placeholder={t('recruitment.location')}
            className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <button type="submit" className="rounded-lg bg-rose-700 px-4 py-2 text-sm text-white">
            {t('recruitment.publishJob')}
          </button>
        </form>
      )}

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('recruitment.jobsSection')}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((j) => (
            <article
              key={j.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="text-xs font-medium uppercase text-rose-600 dark:text-rose-400">
                {j.department}
              </span>
              <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{j.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {j.description}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {j.candidates_count ?? 0} {t('recruitment.candidates')}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('recruitment.pipelineSection')}
        </h2>
        <CandidatePipeline
          candidates={candidates}
          canManage={!!overview?.can_manage}
          onStatusChange={handleStatusChange}
          onPreviewResume={handlePreview}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('recruitment.onboardingSection')}
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">{t('recruitment.noOnboarding')}</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {task.task_title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {task.employee?.name} · {t('recruitment.due')}: {task.due_date}
                  </p>
                </div>
                {task.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => completeTask(task.id)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    {t('recruitment.completeTask')}
                  </button>
                )}
                {task.status === 'completed' && (
                  <span className="text-xs font-medium text-emerald-600">
                    {t('recruitment.completed')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ResumePreviewModal
        url={previewUrl}
        filename={previewName}
        onClose={closePreview}
      />
    </div>
  )
}
