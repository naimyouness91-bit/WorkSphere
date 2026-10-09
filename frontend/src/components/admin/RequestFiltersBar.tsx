import { useTranslation } from 'react-i18next'
import type { RequestFilters } from '../../types/adminDashboard'
import { REQUEST_TYPES } from '../../types/internalRequest'

interface RequestFiltersBarProps {
  filters: RequestFilters
  onChange: (filters: RequestFilters) => void
}

export default function RequestFiltersBar({ filters, onChange }: RequestFiltersBarProps) {
  const { t } = useTranslation()

  const update = (key: keyof RequestFilters, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  const inputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="sm:col-span-2 lg:col-span-2">
        <label className="sr-only">{t('adminDashboard.search')}</label>
        <input
          type="search"
          placeholder={t('adminDashboard.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
          className={`w-full ${inputClass}`}
        />
      </div>
      <select
        value={filters.status}
        onChange={(e) => update('status', e.target.value)}
        className={inputClass}
        aria-label={t('home.status')}
      >
        <option value="">{t('adminDashboard.allStatuses')}</option>
        <option value="pending">{t('status.pending')}</option>
        <option value="approved">{t('status.approved')}</option>
        <option value="rejected">{t('status.rejected')}</option>
      </select>
      <select
        value={filters.type}
        onChange={(e) => update('type', e.target.value)}
        className={inputClass}
        aria-label={t('requests.type')}
      >
        <option value="">{t('adminDashboard.allTypes')}</option>
        {REQUEST_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(`requests.types.${opt.value}`)}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={filters.date_from}
        onChange={(e) => update('date_from', e.target.value)}
        className={inputClass}
        aria-label={t('adminDashboard.dateFrom')}
      />
      <input
        type="date"
        value={filters.date_to}
        onChange={(e) => update('date_to', e.target.value)}
        className={inputClass}
        aria-label={t('adminDashboard.dateTo')}
      />
    </div>
  )
}
