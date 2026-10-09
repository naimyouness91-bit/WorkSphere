import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { settingsApi } from '../../services/settingsApi'
import type { SystemSettingGroup } from '../../types/settings'
import { addNotification } from '../../store/notificationSlice'

export default function SystemSettingsPanel() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const isAdmin = user?.role === 'admin'
  const [groups, setGroups] = useState<SystemSettingGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [savingKey, setSavingKey] = useState<string | null>(null)

  useEffect(() => {
    settingsApi
      .getSystemSettings()
      .then((res) => setGroups(res.data.data.groups))
      .catch(() => dispatch(addNotification({ type: 'error', message: t('settings.loadFailed') })))
      .finally(() => setLoading(false))
  }, [dispatch, t])

  const handleSave = async (key: string) => {
    const value = edits[key]
    if (value === undefined) return
    setSavingKey(key)
    try {
      const { data } = await settingsApi.updateSystemSetting(key, value)
      dispatch(addNotification({ type: 'success', message: data.message }))
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          items: g.items.map((item) =>
            item.key === key ? { ...item, value: data.data.value } : item,
          ),
        })),
      )
      setEdits((e) => {
        const next = { ...e }
        delete next[key]
        return next
      })
    } catch {
      dispatch(addNotification({ type: 'error', message: t('settings.saveFailed') }))
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">{t('common.loading')}</p>
  }

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          {t('settings.systemReadOnly')}
        </p>
      )}
      {groups.map((group) => (
        <section
          key={group.category}
          className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-semibold capitalize dark:border-slate-800">
            {t(`settings.category.${group.category}`, { defaultValue: group.category })}
          </h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {group.items.map((item) => (
              <li key={item.key} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                <div className="min-w-[10rem] flex-1">
                  <p className="font-mono text-sm text-slate-800 dark:text-slate-200">{item.key}</p>
                </div>
                <input
                  value={edits[item.key] ?? item.value}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [item.key]: e.target.value }))}
                  disabled={!isAdmin}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
                />
                {isAdmin && edits[item.key] !== undefined && edits[item.key] !== item.value && (
                  <button
                    type="button"
                    disabled={savingKey === item.key}
                    onClick={() => void handleSave(item.key)}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {savingKey === item.key ? t('common.saving') : t('common.save')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
