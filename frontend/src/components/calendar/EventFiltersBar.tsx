import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { employeesApi } from '../../services/employeesApi'
import type { Employee } from '../../types/employee'
import type { EventFilters } from '../../types/event'
import { EVENT_TYPES } from '../../types/event'
import { useAppSelector } from '../../hooks/redux'

interface EventFiltersBarProps {
  filters: EventFilters
  onChange: (filters: EventFilters) => void
}

export default function EventFiltersBar({ filters, onChange }: EventFiltersBarProps) {
  const { t } = useTranslation()
  const { user } = useAppSelector((state) => state.auth)
  const [employees, setEmployees] = useState<Employee[]>([])
  const showEmployeeFilter = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    if (showEmployeeFilter) {
      employeesApi
        .index()
        .then((res) => setEmployees(res.data.data))
        .catch(() => setEmployees([]))
    }
  }, [showEmployeeFilter])

  const update = (key: keyof EventFilters, value: string) => {
    onChange({ ...filters, [key]: value })
  }

  const inputClass =
    'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {showEmployeeFilter && (
        <select
          value={filters.employee_id}
          onChange={(e) => update('employee_id', e.target.value)}
          className={inputClass}
          aria-label={t('calendar.filterEmployee')}
        >
          <option value="">{t('calendar.allEmployees')}</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
      )}
      <select
        value={filters.type}
        onChange={(e) => update('type', e.target.value)}
        className={inputClass}
        aria-label={t('calendar.filterType')}
      >
        <option value="">{t('calendar.allTypes')}</option>
        {EVENT_TYPES.map((type) => (
          <option key={type} value={type}>
            {t(`calendar.types.${type}`)}
          </option>
        ))}
      </select>
      <select
        value={filters.status}
        onChange={(e) => update('status', e.target.value)}
        className={inputClass}
        aria-label={t('calendar.filterStatus')}
      >
        <option value="">{t('calendar.allStatuses')}</option>
        <option value="scheduled">{t('calendar.status.scheduled')}</option>
        <option value="canceled">{t('calendar.status.canceled')}</option>
      </select>
      <input
        type="date"
        value={filters.date_from}
        onChange={(e) => update('date_from', e.target.value)}
        className={inputClass}
        aria-label={t('calendar.dateFrom')}
      />
      <input
        type="date"
        value={filters.date_to}
        onChange={(e) => update('date_to', e.target.value)}
        className={inputClass}
        aria-label={t('calendar.dateTo')}
      />
    </div>
  )
}
