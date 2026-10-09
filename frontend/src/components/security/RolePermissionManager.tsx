import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { securityApi } from '../../services/securityApi'
import type { RolePermissionRow } from '../../types/security'

const ROLES = ['admin', 'manager', 'employee'] as const
const MODULES = [
  'employees', 'payroll', 'finance', 'inventory', 'crm', 'reports',
  'documents', 'training', 'requests', 'expenses', 'security',
] as const
const PERMISSIONS = ['view', 'create', 'manage', 'delete'] as const

export default function RolePermissionManager() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<RolePermissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<string>('manager')
  const [permission, setPermission] = useState<string>('view')
  const [module, setModule] = useState<string>('employees')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    return securityApi
      .permissions()
      .then((res) => setRows(res.data.data))
      .catch(() => setError(t('security.permissionsLoadFailed')))
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const handleAdd = async () => {
    setSaving(true)
    setError(null)
    setLoading(true)
    try {
      await securityApi.addPermission({ role, permission, module })
      await load()
    } catch {
      setError(t('security.permissionAddFailed'))
    } finally {
      setSaving(false)
      setLoading(false)
    }
  }

  const handleRemove = async (id: number) => {
    try {
      await securityApi.removePermission(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
    } catch {
      setError(t('security.permissionRemoveFailed'))
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        {t('security.permissionsTitle')}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('security.permissionsSubtitle')}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-400">{t('security.role')}</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{t(`security.roles.${r}`, r)}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-400">{t('security.permission')}</span>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            {PERMISSIONS.map((p) => (
              <option key={p} value={p}>{t(`security.permissions.${p}`, p)}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-400">{t('audit.module')}</span>
          <select
            value={module}
            onChange={(e) => setModule(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>{t(`audit.modules.${m}`, m)}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={handleAdd}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {t('security.addPermission')}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">{t('common.loading')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">{t('security.role')}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">{t('security.permission')}</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">{t('audit.module')}</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">{t('audit.actionsLabel')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                    {t('security.noPermissions')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 text-sm">{t(`security.roles.${row.role}`, row.role)}</td>
                    <td className="px-3 py-2 text-sm">{t(`security.permissions.${row.permission}`, row.permission)}</td>
                    <td className="px-3 py-2 text-sm">{t(`audit.modules.${row.module}`, row.module)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(row.id)}
                        className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        {t('security.removePermission')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
