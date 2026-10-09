import { useTranslation } from 'react-i18next'
import type { CrmDeal, DealStage } from '../../types/crm'

const STAGES: DealStage[] = ['prospect', 'negotiation', 'closed']

const STAGE_STYLES: Record<DealStage, string> = {
  prospect: 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30',
  negotiation: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
  closed: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
}

interface DealPipelineProps {
  deals: CrmDeal[]
  canManage: boolean
  onStageChange: (id: number, stage: DealStage, status?: 'won' | 'lost') => void
}

export default function DealPipeline({ deals, canManage, onStageChange }: DealPipelineProps) {
  const { t } = useTranslation()

  const byStage = (stage: DealStage) => deals.filter((d) => d.stage === stage)

  const formatValue = (v: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {STAGES.map((stage) => (
        <div key={stage} className={`rounded-xl border-2 p-3 ${STAGE_STYLES[stage]}`}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            {t(`crm.dealStage.${stage}`)}
            <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs dark:bg-slate-900/50">
              {byStage(stage).length}
            </span>
          </h3>
          <ul className="space-y-2">
            {byStage(stage).map((deal) => (
              <li
                key={deal.id}
                className="rounded-lg border border-white/60 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">{deal.title}</p>
                <p className="text-xs text-slate-500">{deal.client?.company}</p>
                <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {formatValue(deal.value)}
                </p>
                {canManage && (
                  <select
                    value={deal.stage}
                    onChange={(e) => {
                      const next = e.target.value as DealStage
                      if (next === 'closed') {
                        onStageChange(deal.id, next, 'won')
                      } else {
                        onStageChange(deal.id, next)
                      }
                    }}
                    className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {t(`crm.dealStage.${s}`)}
                      </option>
                    ))}
                  </select>
                )}
                {deal.stage === 'closed' && (
                  <span className="mt-1 inline-block text-xs text-emerald-600">{deal.status}</span>
                )}
              </li>
            ))}
            {byStage(stage).length === 0 && (
              <p className="text-xs text-slate-500">{t('crm.pipelineEmpty')}</p>
            )}
          </ul>
        </div>
      ))}
    </div>
  )
}
