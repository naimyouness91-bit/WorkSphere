import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchIntegrationLogs,
  openIntegrationConfig,
  testIntegration,
  toggleIntegrationStatus,
} from '../../store/integrationsSlice'
import type { Integration, IntegrationServiceName } from '../../types/integration'

const SERVICE_COLORS: Record<IntegrationServiceName, string> = {
  slack: 'from-purple-500 to-purple-700',
  teams: 'from-blue-500 to-indigo-700',
  email: 'from-amber-500 to-orange-600',
  google_drive: 'from-emerald-500 to-teal-600',
  google_calendar: 'from-rose-500 to-pink-600',
  dropbox: 'from-sky-500 to-blue-600',
}

interface Props {
  serviceName: IntegrationServiceName
  integration: Integration | null
}

export default function IntegrationServiceCard({ serviceName, integration }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { testStatus } = useAppSelector((s) => s.integrations)

  const isActive = integration?.status === 'active'
  const isConnected = integration?.is_connected ?? false
  const isTesting = testStatus === 'loading'

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className={`rounded-t-xl bg-gradient-to-r ${SERVICE_COLORS[serviceName]} px-4 py-3`}>
        <h3 className="font-semibold text-white">{t(`integrations.services.${serviceName}`)}</h3>
        <p className="text-xs text-white/80">{t(`integrations.descriptions.${serviceName}`)}</p>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              isConnected
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`}
              aria-hidden
            />
            {isConnected ? t('integrations.connected') : t('integrations.disconnected')}
          </span>

          {integration && (
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isActive}
                onChange={() =>
                  dispatch(
                    toggleIntegrationStatus({
                      id: integration.id,
                      status: isActive ? 'inactive' : 'active',
                    }),
                  )
                }
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-focus:outline-none dark:bg-slate-700" />
            </label>
          )}
        </div>

        {integration?.last_sync_at && (
          <p className="mb-3 text-xs text-slate-500">
            {t('integrations.lastSync')}:{' '}
            {new Date(integration.last_sync_at).toLocaleString()}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => dispatch(openIntegrationConfig(serviceName))}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {integration ? t('integrations.edit') : t('integrations.configure')}
          </button>
          {integration && (
            <button
              type="button"
              disabled={!isActive || isTesting}
              onClick={async () => {
                await dispatch(
                  testIntegration({
                    id: integration.id,
                    testEmail: (integration.settings?.test_recipient as string) || undefined,
                  }),
                )
                dispatch(fetchIntegrationLogs(undefined))
              }}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isTesting ? t('integrations.testing') : t('integrations.test')}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
