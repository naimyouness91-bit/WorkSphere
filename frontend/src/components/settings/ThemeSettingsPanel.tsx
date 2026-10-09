import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/theme'
import { useAppDispatch } from '../../hooks/redux'
import { settingsApi } from '../../services/settingsApi'
import type { ThemeMode, ThemeSettings } from '../../types/settings'
import { addNotification } from '../../store/notificationSlice'

const MODES: ThemeMode[] = ['light', 'dark', 'custom']

export default function ThemeSettingsPanel() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { applyFromServer, startPreview, cancelPreview, commitPreview, preview } = useTheme()
  const [settings, setSettings] = useState<ThemeSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<ThemeSettings>({
    theme: 'light',
    primary_color: '#4f46e5',
    secondary_color: '#6366f1',
  })

  useEffect(() => {
    settingsApi
      .getThemeSettings()
      .then((res) => {
        setSettings(res.data.data)
        setDraft(res.data.data)
        applyFromServer(res.data.data)
      })
      .catch(() => dispatch(addNotification({ type: 'error', message: t('settings.loadFailed') })))
      .finally(() => setLoading(false))
  }, [applyFromServer, dispatch, t])

  const handlePreview = () => {
    startPreview({
      theme: draft.theme,
      primary_color: draft.primary_color,
      secondary_color: draft.secondary_color,
    })
  }

  const handleCancelPreview = () => {
    cancelPreview()
    if (settings) setDraft(settings)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = preview ? commitPreview() ?? draft : draft
      const { data } = await settingsApi.updateThemeSettings({
        theme: payload.theme,
        primary_color: payload.primary_color,
        secondary_color: payload.secondary_color,
      })
      setSettings(data.data)
      setDraft(data.data)
      applyFromServer(data.data)
      dispatch(addNotification({ type: 'success', message: data.message }))
    } catch {
      dispatch(addNotification({ type: 'error', message: t('settings.saveFailed') }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{t('common.loading')}</p>
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {t('settings.themeTitle')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('settings.themeHint')}</p>

        <div className="flex flex-wrap gap-2">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, theme: mode }))}
              className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                draft.theme === mode
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {t(`settings.theme.${mode}`)}
            </button>
          ))}
        </div>

        {draft.theme === 'custom' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400">{t('settings.primaryColor')}</span>
              <input
                type="color"
                value={draft.primary_color}
                onChange={(e) => setDraft((d) => ({ ...d, primary_color: e.target.value }))}
                className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-200 dark:border-slate-700"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600 dark:text-slate-400">{t('settings.secondaryColor')}</span>
              <input
                type="color"
                value={draft.secondary_color}
                onChange={(e) => setDraft((d) => ({ ...d, secondary_color: e.target.value }))}
                className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-200 dark:border-slate-700"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            {t('settings.previewTheme')}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleCancelPreview}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
            >
              {t('settings.cancelPreview')}
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('settings.applyTheme')}
          </button>
        </div>
      </div>

      <div
        className="rounded-xl border border-slate-200 p-6 dark:border-slate-800"
        style={{
          background: `linear-gradient(135deg, ${draft.primary_color}22, ${draft.secondary_color}33)`,
        }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {preview ? t('settings.previewMode') : t('settings.previewLabel')}
        </p>
        <div
          className="mt-4 rounded-lg p-4 shadow-sm"
          style={{ backgroundColor: draft.primary_color, color: '#fff' }}
        >
          <p className="font-semibold">WorkSphere</p>
          <p className="mt-1 text-sm opacity-90">{t('settings.previewCard')}</p>
        </div>
        <button
          type="button"
          className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: draft.secondary_color }}
        >
          {t('settings.previewButton')}
        </button>
      </div>
    </div>
  )
}
