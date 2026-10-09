import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ComplianceReportPanel from '../components/compliance/ComplianceReportPanel'
import ContractsPanel from '../components/compliance/ContractsPanel'
import PoliciesPanel from '../components/compliance/PoliciesPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppSelector } from '../hooks/redux'
import { complianceApi } from '../services/complianceApi'
import type { ComplianceOverview } from '../types/compliance'

export default function CompliancePage() {
  const { t } = useTranslation()
  const { user } = useAppSelector((state) => state.auth)
  const [data, setData] = useState<ComplianceOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    complianceApi
      .overview()
      .then((res) => {
        const raw = res.data.data
        setData({
          stats: raw.stats,
          can_manage: raw.can_manage,
          policies: raw.policies as ComplianceOverview['policies'],
          contracts: raw.contracts as ComplianceOverview['contracts'],
          expiring_soon: raw.expiring_soon,
        })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <LoadingSpinner label={t('compliance.loading')} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-red-600">{t('compliance.loadFailed')}</div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 rounded-2xl border border-slate-300 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">{t('compliance.title')}</h1>
        <p className="mt-2 text-slate-300">{t('compliance.subtitle')}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="rounded-lg bg-white/10 px-3 py-1">
            {t('compliance.statPolicies')}: {data.stats.policies_current}
          </span>
          <span className="rounded-lg bg-white/10 px-3 py-1">
            {t('compliance.statPending')}: {data.stats.contracts_pending}
          </span>
          <span className="rounded-lg bg-white/10 px-3 py-1">
            {t('compliance.statSigned')}: {data.stats.contracts_signed}
          </span>
          <span className="rounded-lg bg-emerald-500/30 px-3 py-1 font-semibold">
            {t('compliance.statCompliance')}: {data.stats.compliance_percent}%
          </span>
        </div>
      </header>

      {data.expiring_soon.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <p className="font-semibold">{t('compliance.expiringReminder')}</p>
          <ul className="mt-1 list-inside list-disc">
            {data.expiring_soon.map((c) => (
              <li key={c.id}>
                {c.title} — {c.expires_at}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-8">
        <PoliciesPanel
          policies={data.policies}
          canManage={data.can_manage}
          onRefresh={load}
        />
        <ContractsPanel
          contracts={data.contracts}
          canManage={data.can_manage}
          currentUserId={user?.id}
          onRefresh={load}
        />
        {data.can_manage && <ComplianceReportPanel />}
      </div>
    </div>
  )
}
