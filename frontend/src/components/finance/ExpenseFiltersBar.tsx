import { useTranslation } from 'react-i18next'
import type { ExpenseFilters } from '../../types/expense'

interface Props {
  filters: ExpenseFilters
  onChange: (filters: ExpenseFilters) => void
}

export default function ExpenseFiltersBar({ filters, onChange }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<ExpenseFilters>) => onChange({ ...filters, ...patch })

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('finance.statusLabel')}</label>
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as ExpenseFilters['status'] })}
            className={inputClass}
          >
            <option value="">{t('finance.allStatuses')}</option>
            <option value="pending">{t('finance.status.pending')}</option>
            <option value="approved">{t('finance.status.approved')}</option>
            <option value="rejected">{t('finance.status.rejected')}</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('finance.categoryLabel')}</label>
          <select
            value={filters.category}
            onChange={(e) => update({ category: e.target.value as ExpenseFilters['category'] })}
            className={inputClass}
          >
            <option value="">{t('finance.allCategories')}</option>
            <option value="hr">{t('finance.category.hr')}</option>
            <option value="it">{t('finance.category.it')}</option>
            <option value="operations">{t('finance.category.operations')}</option>
            <option value="other">{t('finance.category.other')}</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('finance.dateFrom')}</label>
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => update({ date_from: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('finance.dateTo')}</label>
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
