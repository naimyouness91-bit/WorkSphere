import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { submitApplication } from '../../store/applicationsSlice'
import type { Job } from '../../types/job'

interface Props {
  openJobs: Job[]
}

export default function ApplicationApplyForm({ openJobs }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { mutationStatus } = useAppSelector((s) => s.applications)

  const [jobId, setJobId] = useState<number>(openJobs[0]?.id ?? 0)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [resume, setResume] = useState<File | null>(null)

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resume || !jobId) return
    dispatch(
      submitApplication({
        job_id: jobId,
        candidate_name: name,
        candidate_email: email,
        resume,
      }),
    ).then((result) => {
      if (submitApplication.fulfilled.match(result)) {
        setResume(null)
      }
    })
  }

  if (openJobs.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">
        {t('applications.noOpenJobs')}
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 dark:border-indigo-900/50 dark:bg-indigo-950/30"
    >
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        {t('applications.applyTitle')}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('applications.applySubtitle')}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">{t('applications.position')}</label>
          <select
            required
            value={jobId || ''}
            onChange={(e) => setJobId(Number(e.target.value))}
            className={inputClass}
          >
            {openJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {job.department}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('applications.candidateName')}</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('applications.candidateEmail')}</label>
          <input required type="email" value={email} readOnly={!!user} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">{t('applications.resume')}</label>
          <input
            required
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-600 file:me-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white"
          />
          <p className="mt-1 text-xs text-slate-500">{t('applications.resumeHint')}</p>
        </div>
      </div>
      <button
        type="submit"
        disabled={mutationStatus === 'loading'}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {mutationStatus === 'loading' ? t('applications.submitting') : t('applications.submit')}
      </button>
    </form>
  )
}
