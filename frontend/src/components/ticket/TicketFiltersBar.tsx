import { useTranslation } from 'react-i18next'
import type { TicketFilters } from '../../types/ticket'

interface Props {
  filters: TicketFilters
  onChange: (filters: TicketFilters) => void
}

export default function TicketFiltersBar({ filters, onChange }: Props) {
  const { t } = useTranslation()
  const update = (patch: Partial<TicketFilters>) => onChange({ ...filters, ...patch })

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('tickets.statusLabel')}</label>
          <select value={filters.status} onChange={(e) => update({ status: e.target.value })} className={inputClass}>
            <option value="">{t('tickets.allStatuses')}</option>
            <option value="open">{t('tickets.status.open')}</option>
            <option value="in_progress">{t('tickets.status.in_progress')}</option>
            <option value="resolved">{t('tickets.status.resolved')}</option>
            <option value="closed">{t('tickets.status.closed')}</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('tickets.categoryLabel')}</label>
          <select value={filters.category} onChange={(e) => update({ category: e.target.value })} className={inputClass}>
            <option value="">{t('tickets.allCategories')}</option>
            <option value="it">{t('tickets.category.it')}</option>
            <option value="hr">{t('tickets.category.hr')}</option>
            <option value="finance">{t('tickets.category.finance')}</option>
            <option value="other">{t('tickets.category.other')}</option>
          </select>
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">{t('tickets.priorityLabel')}</label>
          <select value={filters.priority} onChange={(e) => update({ priority: e.target.value })} className={inputClass}>
            <option value="">{t('tickets.allPriorities')}</option>
            <option value="low">{t('tickets.priority.low')}</option>
            <option value="medium">{t('tickets.priority.medium')}</option>
            <option value="high">{t('tickets.priority.high')}</option>
          </select>
        </div>
      </div>
    </div>
  )
}
