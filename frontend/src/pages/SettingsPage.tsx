import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import SystemSettingsPanel from '../components/settings/SystemSettingsPanel'
import ThemeSettingsPanel from '../components/settings/ThemeSettingsPanel'
import WorkflowBuilder from '../components/settings/WorkflowBuilder'
import { useAppDispatch } from '../hooks/redux'
import { settingsApi } from '../services/settingsApi'
import type { CustomizationAuditEntry, Workflow } from '../types/settings'
import { downloadWorkflowsJson, exportWorkflowsToExcel } from '../utils/exportWorkflows'
import { addNotification } from '../store/notificationSlice'

type Tab = 'theme' | 'workflows' | 'system'

export default function SettingsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [tab, setTab] = useState<Tab>('theme')
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [stats, setStats] = useState({ active: 0, themes: 0 })
  const [history, setHistory] = useState<CustomizationAuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadWorkflows = useCallback(() => {
    settingsApi.getWorkflows().then((res) => {
      setWorkflows(res.data.data.workflows)
      setStats((s) => ({ ...s, active: res.data.data.workflows.filter((w) => w.is_active).length }))
    })
  }, [])

  useEffect(() => {
    Promise.all([
      settingsApi.getWorkflows(),
      settingsApi.customizationHistory(),
      settingsApi.stats(),
    ])
      .then(([wf, hist, st]) => {
        setWorkflows(wf.data.data.workflows)
        setStats({
          active: st.data.data.active_workflows,
          themes: st.data.data.custom_themes_applied,
        })
        setHistory(hist.data.data.logs)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleExportJson = async () => {
    try {
      const { data } = await settingsApi.exportWorkflows()
      downloadWorkflowsJson(data.data)
      dispatch(addNotification({ type: 'success', message: t('settings.exportJsonSuccess') }))
    } catch {
      dispatch(addNotification({ type: 'error', message: t('settings.exportFailed') }))
    }
  }

  const handleExportExcel = async () => {
    try {
      const { data } = await settingsApi.exportWorkflows()
      exportWorkflowsToExcel(data.data.workflows)
      dispatch(addNotification({ type: 'success', message: t('settings.exportExcelSuccess') }))
    } catch {
      dispatch(addNotification({ type: 'error', message: t('settings.exportFailed') }))
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'theme', label: t('settings.tabTheme') },
    { id: 'workflows', label: t('settings.tabWorkflows') },
    { id: 'system', label: t('settings.tabSystem') },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('settings.subtitle')}</p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <KpiCard label={t('settings.kpiActiveWorkflows')} value={stats.active} accent="indigo" />
        <KpiCard label={t('settings.kpiCustomThemes')} value={stats.themes} accent="violet" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'workflows' && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleExportJson()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
          >
            {t('settings.exportJson')}
          </button>
          <button
            type="button"
            onClick={() => void handleExportExcel()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
          >
            {t('settings.exportExcel')}
          </button>
        </div>
      )}

      {loading && tab !== 'theme' ? (
        <LoadingSpinner label={t('common.loading')} />
      ) : (
        <>
          {tab === 'theme' && <ThemeSettingsPanel />}
          {tab === 'workflows' && (
            <WorkflowBuilder workflows={workflows} onRefresh={loadWorkflows} />
          )}
          {tab === 'system' && <SystemSettingsPanel />}
        </>
      )}

      {history.length > 0 && (
        <section className="mt-10 rounded-xl border border-slate-200 dark:border-slate-800">
          <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold dark:border-slate-800">
            {t('settings.historyTitle')}
          </h2>
          <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {history.slice(0, 8).map((log) => (
              <li key={log.id} className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-800 dark:text-slate-200">{log.action}</span>
                {' · '}
                {log.entity_type}
                {' · '}
                {new Date(log.logged_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
