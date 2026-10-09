import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ActivityFeed from '../components/home/ActivityFeed'
import GuestLanding from '../components/home/GuestLanding'
import HomeFeatureCards from '../components/home/HomeFeatureCards'
import HomeFooter from '../components/home/HomeFooter'
import HomeHero from '../components/home/HomeHero'
import QuickActions from '../components/home/QuickActions'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppSelector } from '../hooks/redux'
import { homeApi, type HomeOverview } from '../services/homeApi'
import { formatMoney } from '../utils/currency'
import { useOfflineSync } from '../hooks/useOfflineSync'

export default function HomePage() {
  const { t } = useTranslation()
  const { user, token } = useAppSelector((state) => state.auth)
  const [data, setData] = useState<HomeOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { lastSyncAt, pendingCount } = useOfflineSync()

  // Clear the cached dashboard when the session ends. Adjust state during
  // render instead of setting it inside an effect.
  const [prevToken, setPrevToken] = useState(token)
  if (prevToken !== token) {
    setPrevToken(token)
    if (!token) {
      setData(null)
    }
  }

  useEffect(() => {
    if (!token) {
      return
    }

    homeApi
      .overview()
      .then((res) => setData(res.data.data))
      .catch(() => setError(t('home.loadFailed')))
      .finally(() => setLoading(false))
  }, [token, t])

  if (!token || !user) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col px-4 py-6 sm:py-10">
        <div className="flex-1">
          <GuestLanding />
        </div>
        <HomeFooter />
      </div>
    )
  }

  const showEmployeeKpi = data?.kpis.total_employees !== null

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col px-4 py-6 sm:py-10">
      <div className="flex-1 space-y-8">
        <HomeHero user={user} />

        {loading && !data ? (
          <LoadingSpinner label={t('home.loading')} />
        ) : error ? (
          <p className="text-center text-red-600 dark:text-red-400">{error}</p>
        ) : data ? (
          <>
            <section
              className={`grid gap-4 ${showEmployeeKpi ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}
            >
              {showEmployeeKpi && (
                <div className="animate-fade-in-up">
                  <KpiCard
                    label={t('home.kpiEmployees')}
                    value={data.kpis.total_employees!}
                    accent="indigo"
                  />
                </div>
              )}
              <div className="animate-fade-in-up [animation-delay:50ms]">
                <KpiCard
                  label={t('home.kpiPendingRequests')}
                  value={data.kpis.pending_requests}
                  accent="amber"
                />
              </div>
              <div className="animate-fade-in-up [animation-delay:100ms]">
                <KpiCard
                  label={t('home.kpiUpcomingTrainings')}
                  value={data.kpis.upcoming_trainings}
                  accent="violet"
                />
              </div>
              <div className="animate-fade-in-up [animation-delay:150ms]">
                <KpiCard
                  label={t('home.kpiActiveProjects')}
                  value={data.kpis.active_projects}
                  accent="emerald"
                />
              </div>
              <div className="animate-fade-in-up col-span-2 sm:col-span-1 [animation-delay:200ms]">
                <KpiCard
                  label={t('home.kpiAiSuggestions')}
                  value={data.kpis.ai_suggestions_today ?? 0}
                  accent="violet"
                />
              </div>
              {data.kpis.gamification_stats && (
                <Link
                  to="/gamification"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:250ms]"
                >
                  <KpiCard
                    label={t('home.kpiGamification')}
                    value={data.kpis.gamification_stats.total_points}
                    subtext={t('home.kpiGamificationSub', {
                      level: data.kpis.gamification_stats.level,
                      badges: data.kpis.gamification_stats.badges_earned,
                      rank: data.kpis.gamification_stats.company_rank ?? '—',
                    })}
                    accent="rose"
                  />
                </Link>
              )}
              {data.kpis.compliance_status && (
                <Link
                  to="/compliance"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:300ms]"
                >
                  <KpiCard
                    label={t('home.kpiCompliance')}
                    value={`${data.kpis.compliance_status.compliance_percent}%`}
                    subtext={t('home.kpiComplianceSub', {
                      pending: data.kpis.compliance_status.contracts_pending,
                      signed: data.kpis.compliance_status.contracts_signed,
                    })}
                    accent="indigo"
                  />
                </Link>
              )}
              {data.kpis.knowledge_base_stats && (
                <Link
                  to="/knowledge"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:325ms]"
                >
                  <KpiCard
                    label={t('home.kpiKnowledge')}
                    value={data.kpis.knowledge_base_stats.recent_updates}
                    subtext={t('home.kpiKnowledgeSub', {
                      articles: data.kpis.knowledge_base_stats.new_articles_30d,
                      documents: data.kpis.knowledge_base_stats.new_documents_30d,
                    })}
                    accent="violet"
                  />
                </Link>
              )}
              {data.kpis.recruitment_stats && (
                <Link
                  to="/recruitment"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:340ms]"
                >
                  <KpiCard
                    label={t('home.kpiOpenPositions')}
                    value={data.kpis.recruitment_stats.open_positions}
                    subtext={t('home.kpiRecruitmentSub', {
                      pipeline: data.kpis.recruitment_stats.candidates_in_pipeline,
                      onboarding: data.kpis.recruitment_stats.onboarding_tasks_pending,
                    })}
                    accent="rose"
                  />
                </Link>
              )}
              {data.kpis.crm_stats && (
                <Link
                  to="/crm"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:360ms]"
                >
                  <KpiCard
                    label={t('home.kpiActiveClients')}
                    value={data.kpis.crm_stats.active_clients}
                    subtext={t('home.kpiCrmSub', {
                      pipeline: data.kpis.crm_stats.deals_in_pipeline,
                      closed: data.kpis.crm_stats.closed_deals,
                    })}
                    accent="indigo"
                  />
                </Link>
              )}
              {data.kpis.helpdesk_stats && (
                <Link
                  to="/tickets"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:380ms]"
                >
                  <KpiCard
                    label={t('home.kpiOpenTickets')}
                    value={data.kpis.helpdesk_stats.open_tickets}
                    subtext={t('home.kpiHelpdeskSub', {
                      breaches: data.kpis.helpdesk_stats.sla_breaches,
                      resolved: data.kpis.helpdesk_stats.resolved_tickets,
                    })}
                    accent="cyan"
                  />
                </Link>
              )}
              {data.kpis.finance_stats && (
                <Link
                  to="/finance"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:420ms]"
                >
                  <KpiCard
                    label={t('home.kpiTotalExpensesFinance')}
                    value={formatMoney(data.kpis.finance_stats.total_expenses)}
                    subtext={t('home.kpiFinanceSub', {
                      pending: data.kpis.finance_stats.pending_invoices,
                      util: data.kpis.finance_stats.budget_utilization,
                    })}
                    accent="emerald"
                  />
                </Link>
              )}
              {data.kpis.inventory_stats && (
                <Link
                  to="/inventory"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:440ms]"
                >
                  <KpiCard
                    label={t('home.kpiTotalItems')}
                    value={data.kpis.inventory_stats.total_items}
                    subtext={t('home.kpiInventorySub', {
                      suppliers: data.kpis.inventory_stats.active_suppliers,
                      pending: data.kpis.inventory_stats.pending_pos,
                    })}
                    accent="orange"
                  />
                </Link>
              )}
              {data.kpis.security_stats && (
                <Link
                  to="/audit-logs"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:460ms]"
                >
                  <KpiCard
                    label={t('home.kpiActiveAlerts')}
                    value={data.kpis.security_stats.active_alerts}
                    subtext={t('home.kpiSecuritySub', {
                      failed: data.kpis.security_stats.failed_logins_24h,
                      unauthorized: data.kpis.security_stats.unauthorized_attempts_24h,
                    })}
                    accent="rose"
                  />
                </Link>
              )}
              {data.kpis.integration_stats && (
                <Link
                  to="/integrations"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:480ms]"
                >
                  <KpiCard
                    label={t('home.kpiActiveIntegrations')}
                    value={data.kpis.integration_stats.active_integrations}
                    subtext={t('home.kpiIntegrationSub', {
                      sent: data.kpis.integration_stats.messages_sent,
                      failed: data.kpis.integration_stats.failed_logs,
                    })}
                    accent="violet"
                  />
                </Link>
              )}
              {data.kpis.analytics_stats && (
                <Link
                  to="/reports"
                  className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:500ms]"
                >
                  <KpiCard
                    label={t('home.kpiReportsGenerated')}
                    value={data.kpis.analytics_stats.reports_generated}
                    subtext={t('home.kpiAnalyticsSub', {
                      insights: data.kpis.analytics_stats.insights_available,
                      accuracy: Math.round(data.kpis.analytics_stats.prediction_accuracy * 100),
                    })}
                    accent="indigo"
                  />
                </Link>
              )}
              <Link
                to="/mobile-offline"
                className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:520ms]"
              >
                <KpiCard
                  label={t('home.kpiPendingChanges')}
                  value={pendingCount}
                  subtext={t('home.kpiOfflineSub')}
                  accent="amber"
                />
              </Link>
              <Link
                to="/mobile-offline"
                className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:540ms]"
              >
                <KpiCard
                  label={t('home.kpiLastSync')}
                  value={
                    lastSyncAt
                      ? new Date(lastSyncAt).toLocaleDateString()
                      : data.kpis.offline_stats?.last_sync_at
                        ? new Date(data.kpis.offline_stats.last_sync_at).toLocaleDateString()
                        : '—'
                  }
                  subtext={
                    lastSyncAt || data.kpis.offline_stats?.last_sync_at
                      ? new Date(lastSyncAt ?? data.kpis.offline_stats!.last_sync_at!).toLocaleTimeString()
                      : t('offline.never')
                  }
                  accent="emerald"
                />
              </Link>
              {data.kpis.customization_stats && (
                <>
                  <Link
                    to="/settings"
                    className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:560ms]"
                  >
                    <KpiCard
                      label={t('home.kpiActiveWorkflows')}
                      value={data.kpis.customization_stats.active_workflows}
                      accent="indigo"
                    />
                  </Link>
                  <Link
                    to="/settings"
                    className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:580ms]"
                  >
                    <KpiCard
                      label={t('home.kpiCustomThemes')}
                      value={data.kpis.customization_stats.custom_themes_applied}
                      accent="violet"
                    />
                  </Link>
                </>
              )}
              {data.kpis.project_management && (
                <>
                  <Link
                    to="/projects"
                    className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:350ms]"
                  >
                    <KpiCard
                      label={t('home.kpiActiveProjectsMgmt')}
                      value={data.kpis.project_management.active_projects}
                      accent="indigo"
                    />
                  </Link>
                  <Link
                    to="/projects"
                    className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:400ms]"
                  >
                    <KpiCard
                      label={t('home.kpiCompletedTasks')}
                      value={data.kpis.project_management.completed_tasks}
                      accent="emerald"
                    />
                  </Link>
                  <Link
                    to="/projects"
                    className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:450ms]"
                  >
                    <KpiCard
                      label={t('home.kpiUpcomingMilestones')}
                      value={data.kpis.project_management.upcoming_milestones}
                      accent="amber"
                    />
                  </Link>
                </>
              )}
              {data.kpis.asset_stats && (
                <>
                  <Link
                    to="/assets"
                    className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:350ms]"
                  >
                    <KpiCard
                      label={t('home.kpiTotalAssets')}
                      value={data.kpis.asset_stats.total_assets}
                      accent="indigo"
                    />
                  </Link>
                  <Link
                    to="/assets?status=maintenance"
                    className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:400ms]"
                  >
                    <KpiCard
                      label={t('home.kpiAssetsMaintenance')}
                      value={data.kpis.asset_stats.in_maintenance}
                      accent="amber"
                    />
                  </Link>
                  <Link
                    to="/assets"
                    className="animate-fade-in-up col-span-2 block sm:col-span-1 [animation-delay:450ms]"
                  >
                    <KpiCard
                      label={t('home.kpiAssetsAssigned')}
                      value={data.kpis.asset_stats.assigned_assets}
                      accent="emerald"
                    />
                  </Link>
                </>
              )}
            </section>

            <QuickActions />
            <ActivityFeed items={data.recent_activity} />

            <section className="animate-fade-in-up [animation-delay:300ms]">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('home.exploreModules')}
              </h2>
              <HomeFeatureCards />
            </section>
          </>
        ) : null}
      </div>

      <HomeFooter />
    </div>
  )
}
