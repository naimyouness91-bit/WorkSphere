import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import IntegrationConfigModal from '../components/integrations/IntegrationConfigModal'
import IntegrationServiceCard from '../components/integrations/IntegrationServiceCard'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { integrationsApi } from '../services/integrationsApi'
import {
  AVAILABLE_INTEGRATIONS,
  type Integration,
  type IntegrationServiceName,
  type WebhookLog,
} from '../types/integration'
import {
  fetchIntegrationLogs,
  fetchIntegrations,
  fetchIntegrationSummary,
} from '../store/integrationsSlice'
import { downloadIntegrationsBackup, exportIntegrationLogsToExcel } from '../utils/exportIntegrations'
import { addNotification } from '../store/notificationSlice'

type LogTab = 'activity' | 'webhook'

export default function IntegrationsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { items, logs, kpis, status, editingService } = useAppSelector((s) => s.integrations)
  const [logTab, setLogTab] = useState<LogTab>('activity')
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])

  useEffect(() => {
    dispatch(fetchIntegrations())
    dispatch(fetchIntegrationLogs(undefined))
    dispatch(fetchIntegrationSummary())
    integrationsApi.webhookLogs().then((res) => setWebhookLogs(res.data.data ?? [])).catch(() => {})
  }, [dispatch])

  const getIntegration = (service: IntegrationServiceName): Integration | null =>
    items.find((i) => i.service_name === service) ?? null

  const handleExportSettings = async () => {
    try {
      const { data } = await integrationsApi.export()
      downloadIntegrationsBackup(data.data, data.exported_at)
      dispatch(addNotification({ type: 'success', message: t('integrations.exportSuccess') }))
    } catch {
      dispatch(addNotification({ type: 'error', message: t('integrations.exportFailed') }))
    }
  }

  const handleExportLogs = async () => {
    try {
      const type = logTab === 'webhook' ? 'webhook' : 'activity'
      const { data } = await integrationsApi.exportLogs(type)
      exportIntegrationLogsToExcel(
        data.data,
        `worksphere-${type}-logs-${new Date().toISOString().slice(0, 10)}.xlsx`,
      )
      dispatch(addNotification({ type: 'success', message: t('integrations.exportLogsSuccess') }))
    } catch {
      dispatch(addNotification({ type: 'error', message: t('integrations.exportFailed') }))
    }
  }

  const handleSyncCalendars = async () => {
    try {
      const { data } = await integrationsApi.syncCalendars()
      dispatch(addNotification({ type: 'success', message: data.message }))
      dispatch(fetchIntegrationSummary())
    } catch {
      dispatch(addNotification({ type: 'error', message: t('integrations.syncFailed') }))
    }
  }

  const formatLastSync = (iso: string | null | undefined) => {
    if (!iso) return t('integrations.never')
    return new Date(iso).toLocaleString()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
            {t('integrations.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            {t('integrations.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSyncCalendars}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {t('integrations.syncCalendars')}
          </button>
          <button
            type="button"
            onClick={handleExportSettings}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {t('integrations.exportJson')}
          </button>
        </div>
      </div>

      {kpis && (
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <KpiCard
            label={t('integrations.kpiActive')}
            value={kpis.active_integrations}
            subtext={`/ ${kpis.total_integrations} ${t('integrations.configured')}`}
            accent="indigo"
          />
          <KpiCard
            label={t('integrations.kpiMessagesSent')}
            value={kpis.messages_sent ?? 0}
            accent="emerald"
          />
          <KpiCard
            label={t('integrations.kpiFailedLogs')}
            value={kpis.failed_logs ?? 0}
            accent="rose"
          />
          <KpiCard
            label={t('integrations.kpiLastSync')}
            value={formatLastSync(kpis.last_sync_at)}
            accent="violet"
          />
        </section>
      )}

      {status === 'loading' && items.length === 0 ? (
        <div className="mt-10">
          <LoadingSpinner label={t('common.loading')} />
        </div>
      ) : (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {AVAILABLE_INTEGRATIONS.map((service) => (
            <IntegrationServiceCard
              key={service}
              serviceName={service}
              integration={getIntegration(service)}
            />
          ))}
        </section>
      )}

      <section className="mt-10 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLogTab('activity')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                logTab === 'activity'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {t('integrations.activityLog')}
            </button>
            <button
              type="button"
              onClick={() => setLogTab('webhook')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                logTab === 'webhook'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {t('integrations.webhookLog')}
            </button>
          </div>
          <button
            type="button"
            onClick={handleExportLogs}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {t('integrations.exportExcel')}
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-4 sm:p-6">
          {logTab === 'activity' ? (
            logs.length === 0 ? (
              <p className="text-center text-sm text-slate-500">{t('integrations.noLogs')}</p>
            ) : (
              <ul className="space-y-3">
                {logs.map((log) => (
                  <li
                    key={log.id}
                    className="flex flex-wrap items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium uppercase ${
                        log.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40'
                      }`}
                    >
                      {log.status}
                    </span>
                    {log.service_name && (
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                        {t(`integrations.services.${log.service_name}`, log.service_name)}
                      </span>
                    )}
                    <span className="flex-1 text-slate-700 dark:text-slate-300">{log.message}</span>
                    <time className="text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            )
          ) : webhookLogs.length === 0 ? (
            <p className="text-center text-sm text-slate-500">{t('integrations.noWebhookLogs')}</p>
          ) : (
            <ul className="space-y-3">
              {webhookLogs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-800/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {t(`integrations.services.${log.service_name}`, log.service_name)}
                    </span>
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-700">
                      {log.event_type}
                    </span>
                    <time className="ml-auto text-xs text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </time>
                  </div>
                  {log.payload && (
                    <pre className="mt-2 max-h-24 overflow-auto text-xs text-slate-600 dark:text-slate-400">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {editingService && (
        <IntegrationConfigModal
          serviceName={editingService}
          integration={getIntegration(editingService)}
        />
      )}
    </div>
  )
}
