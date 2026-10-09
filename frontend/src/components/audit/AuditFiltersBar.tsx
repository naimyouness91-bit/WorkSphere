import { useTranslation } from 'react-i18next'
import type { AuditLogFilters } from '../../types/auditLog'

interface Props {
  filters: AuditLogFilters
  onChange: (filters: AuditLogFilters) => void
  users: { id: number; name: string }[]
}

const MODULES = [
  'auth',
  'requests',
  'payroll',
  'jobs',
  'applications',
  'employees',
  'documents',
  'events',
  'training',
  'evaluations',
  'skills',
  'projects',
  'tasks',
  'tickets',
  'chat',
  'attendance',
  'leaves',
  'finance',
  'users',
]

const ACTIONS = ['login', 'login_failed', 'logout', 'create', 'update', 'delete']

export default function AuditFiltersBar({ filters, onChange, users }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<AuditLogFilters>) => onChange({ ...filters, ...patch })

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-slate-500">{t('audit.search')}</label>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          placeholder={t('audit.searchPlaceholder')}
          className={inputClass}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('audit.user')}</label>
          <select
            value={filters.user_id}
            onChange={(e) => update({ user_id: e.target.value })}
            className={inputClass}
          >
            <option value="">{t('audit.allUsers')}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('audit.module')}</label>
          <select value={filters.module} onChange={(e) => update({ module: e.target.value })} className={inputClass}>
            <option value="">{t('audit.allModules')}</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {t(`audit.modules.${m}`, m)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('audit.action')}</label>
          <select value={filters.action} onChange={(e) => update({ action: e.target.value })} className={inputClass}>
            <option value="">{t('audit.allActions')}</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {t(`audit.actions.${a}`, a)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('audit.dateFrom')}</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => update({ date_from: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('audit.dateTo')}</label>
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => update({ date_to: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  )
}
