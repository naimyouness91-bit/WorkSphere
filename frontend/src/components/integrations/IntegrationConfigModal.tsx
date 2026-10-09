import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  closeIntegrationConfig,
  createIntegration,
  updateIntegration,
} from '../../store/integrationsSlice'
import type { Integration, IntegrationServiceName } from '../../types/integration'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

interface Props {
  integration: Integration | null
  serviceName: IntegrationServiceName
}

function defaultSettings(service: IntegrationServiceName): Record<string, string> {
  if (service === 'email') {
    return {
      smtp_host: '',
      smtp_port: '587',
      smtp_username: '',
      smtp_encryption: 'tls',
      from_address: '',
      from_name: 'WorkSphere',
      test_recipient: '',
    }
  }
  if (service === 'google_drive') {
    return { folder_id: '' }
  }
  if (service === 'google_calendar') {
    return { calendar_id: 'primary' }
  }
  if (service === 'slack') {
    return { channel: '' }
  }
  return {}
}

export default function IntegrationConfigModal({ integration, serviceName }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isConfigOpen, mutationStatus } = useAppSelector((s) => s.integrations)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [settings, setSettings] = useState<Record<string, string>>(defaultSettings(serviceName))

  // Reset the config form whenever the modal opens or targets another
  // integration. Adjust state during render instead of setting state in an
  // effect.
  const cfgKey = `${isConfigOpen}:${integration?.id ?? 'new'}`
  const [prevCfgKey, setPrevCfgKey] = useState(cfgKey)
  if (prevCfgKey !== cfgKey) {
    setPrevCfgKey(cfgKey)
    if (isConfigOpen) {
      setWebhookUrl(integration?.webhook_url ?? '')
      setApiKey('')
      setSettings({
        ...defaultSettings(serviceName),
        ...(integration?.settings as Record<string, string> | undefined),
      })
    }
  }

  if (!isConfigOpen) return null

  const isEdit = Boolean(integration)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      webhook_url: webhookUrl || undefined,
      api_key: apiKey || undefined,
      settings,
    }

    if (isEdit && integration) {
      dispatch(updateIntegration({ id: integration.id, data: payload }))
    } else {
      dispatch(
        createIntegration({
          service_name: serviceName,
          status: 'inactive',
          ...payload,
        }),
      )
    }
  }

  const updateSetting = (key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t('integrations.configure')} — {t(`integrations.services.${serviceName}`)}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {(serviceName === 'slack' || serviceName === 'teams') && (
            <div>
              <label className="mb-1 block text-sm font-medium">{t('integrations.webhookUrl')}</label>
              <input
                required
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          )}

          {serviceName === 'slack' && (
            <div>
              <label className="mb-1 block text-sm font-medium">{t('integrations.channel')}</label>
              <input
                value={settings.channel ?? ''}
                onChange={(e) => updateSetting('channel', e.target.value)}
                placeholder="#general"
                className={inputClass}
              />
            </div>
          )}

          {serviceName === 'email' && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('integrations.smtpHost')}</label>
                  <input
                    required
                    value={settings.smtp_host ?? ''}
                    onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">{t('integrations.smtpPort')}</label>
                  <input
                    value={settings.smtp_port ?? '587'}
                    onChange={(e) => updateSetting('smtp_port', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('integrations.smtpUser')}</label>
                <input
                  value={settings.smtp_username ?? ''}
                  onChange={(e) => updateSetting('smtp_username', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('integrations.fromAddress')}</label>
                <input
                  type="email"
                  value={settings.from_address ?? ''}
                  onChange={(e) => updateSetting('from_address', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">{t('integrations.testRecipient')}</label>
                <input
                  type="email"
                  value={settings.test_recipient ?? ''}
                  onChange={(e) => updateSetting('test_recipient', e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {(serviceName === 'email' ||
            serviceName === 'google_drive' ||
            serviceName === 'google_calendar' ||
            serviceName === 'dropbox') && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                {serviceName === 'email' ? t('integrations.smtpPassword') : t('integrations.apiKey')}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={integration?.has_api_key ? t('integrations.keepExistingKey') : ''}
                className={inputClass}
              />
            </div>
          )}

          {serviceName === 'google_calendar' && (
            <div>
              <label className="mb-1 block text-sm font-medium">{t('integrations.calendarId')}</label>
              <input
                value={settings.calendar_id ?? 'primary'}
                onChange={(e) => updateSetting('calendar_id', e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          {serviceName === 'google_drive' && (
            <div>
              <label className="mb-1 block text-sm font-medium">{t('integrations.folderId')}</label>
              <input
                value={settings.folder_id ?? ''}
                onChange={(e) => updateSetting('folder_id', e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeIntegrationConfig())}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutationStatus === 'loading' ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
