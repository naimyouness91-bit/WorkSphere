import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TicketSla, SlaStatus } from '../../types/helpdesk'

const SLA_STYLES: Record<SlaStatus, string> = {
  on_track: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  at_risk: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  breached: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  met: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

interface Props {
  sla: TicketSla
}

export default function SlaTracker({ sla }: Props) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const responseDue = new Date(sla.response_due_at).getTime()
  const resolutionDue = new Date(sla.resolution_due_at).getTime()
  const responseLeft = Math.max(0, Math.floor((responseDue - now) / 1000))
  const resolutionLeft = Math.max(0, Math.floor((resolutionDue - now) / 1000))

  return (
    <div className="rounded-xl border border-cyan-200/60 bg-gradient-to-br from-slate-50 to-cyan-50/30 p-4 dark:border-cyan-900/40 dark:from-slate-900 dark:to-cyan-950/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t('helpdesk.slaTitle')}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SLA_STYLES[sla.status]}`}>
          {t(`helpdesk.slaStatus.${sla.status}`)}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white/80 p-3 dark:bg-slate-800/60">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('helpdesk.responseTarget')}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-cyan-700 dark:text-cyan-400">
            {formatCountdown(responseLeft)}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 p-3 dark:bg-slate-800/60">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{t('helpdesk.resolutionTarget')}</p>
          <p className="mt-1 font-mono text-2xl font-bold text-indigo-700 dark:text-indigo-400">
            {formatCountdown(resolutionLeft)}
          </p>
        </div>
      </div>
    </div>
  )
}
