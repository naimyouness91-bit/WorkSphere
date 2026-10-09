import { useTranslation } from 'react-i18next'
import type { Candidate, CandidateStatus } from '../../types/recruitment'

const STAGES: CandidateStatus[] = ['applied', 'shortlisted', 'interviewed', 'hired']

const STAGE_COLORS: Record<CandidateStatus, string> = {
  applied: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
  shortlisted: 'border-indigo-300 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30',
  interviewed: 'border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30',
  hired: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
  rejected: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
}

interface CandidatePipelineProps {
  candidates: Candidate[]
  canManage: boolean
  onStatusChange: (id: number, status: CandidateStatus) => void
  onPreviewResume: (candidate: Candidate) => void
}

export default function CandidatePipeline({
  candidates,
  canManage,
  onStatusChange,
  onPreviewResume,
}: CandidatePipelineProps) {
  const { t } = useTranslation()

  const byStage = (stage: CandidateStatus) =>
    candidates.filter((c) => c.status === stage)

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STAGES.map((stage) => (
        <div
          key={stage}
          className={`rounded-xl border-2 p-3 ${STAGE_COLORS[stage]}`}
        >
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            {t(`recruitment.status.${stage}`)}
            <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs dark:bg-slate-900/50">
              {byStage(stage).length}
            </span>
          </h3>
          <ul className="space-y-2">
            {byStage(stage).map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-white/60 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                <p className="text-xs text-slate-500">{c.email}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {c.job_posting?.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => onPreviewResume(c)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
                  >
                    {t('recruitment.viewResume')}
                  </button>
                  {canManage && stage !== 'hired' && (
                    <select
                      value={c.status}
                      onChange={(e) =>
                        onStatusChange(c.id, e.target.value as CandidateStatus)
                      }
                      className="ml-auto rounded border border-slate-200 px-1 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-800"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {t(`recruitment.status.${s}`)}
                        </option>
                      ))}
                      <option value="rejected">{t('recruitment.status.rejected')}</option>
                    </select>
                  )}
                </div>
              </li>
            ))}
            {byStage(stage).length === 0 && (
              <p className="text-xs text-slate-500">{t('recruitment.pipelineEmpty')}</p>
            )}
          </ul>
        </div>
      ))}
    </div>
  )
}
