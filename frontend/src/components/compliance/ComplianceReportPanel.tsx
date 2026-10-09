import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from '../LoadingSpinner'
import { complianceApi } from '../../services/complianceApi'
import type { ComplianceReport } from '../../types/compliance'

export default function ComplianceReportPanel() {
  const { t } = useTranslation()
  const [report, setReport] = useState<ComplianceReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    complianceApi
      .report()
      .then((res) => setReport(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner label={t('compliance.loadingReport')} />
  if (!report) return null

  return (
    <section className="rounded-2xl border border-slate-300 bg-slate-50 p-6 dark:border-slate-600 dark:bg-slate-900/50">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {t('compliance.reportTitle')}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('compliance.reportSubtitle')}</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <ReportStat label={t('compliance.reportSigned')} value={report.summary.signed} />
        <ReportStat label={t('compliance.reportPending')} value={report.summary.pending} />
        <ReportStat label={t('compliance.reportExpired')} value={report.summary.expired} />
        <ReportStat label={t('compliance.reportTotal')} value={report.summary.total_contracts} />
        <ReportStat label={t('compliance.reportPolicies')} value={report.summary.current_policies} />
      </div>

      {report.unsigned_employees.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {t('compliance.unsignedTitle')}
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {report.unsigned_employees.map((row) => (
              <li key={row.id} className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>{row.name}</span>
                <span className="text-amber-700 dark:text-amber-300">
                  {row.pending_contracts} {t('compliance.pending')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.expiring_soon.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {t('compliance.expiringTitle')}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
            {report.expiring_soon.map((c) => (
              <li key={c.id}>
                {c.title} — {c.employee} ({c.expires_at})
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function ReportStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm dark:bg-slate-800">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}
