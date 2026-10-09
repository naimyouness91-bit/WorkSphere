import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import LeaveFiltersBar from '../components/leave/LeaveFiltersBar'
import LeaveFormModal from '../components/leave/LeaveFormModal'
import KpiCard from '../components/KpiCard'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { usersApi } from '../services/usersApi'
import {
  approveLeave,
  fetchLeaveCalendar,
  fetchLeaves,
  openLeaveForm,
  rejectLeave,
  setLeaveFilters,
  setLeaveViewMode,
} from '../store/leavesSlice'
import type { AppUser } from '../types/userList'
import { LEAVE_STATUS_STYLES } from '../utils/attendanceBadges'
import { exportLeavesToExcel, exportLeavesToPdf } from '../utils/exportAttendanceLeave'
export default function LeavesPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters, viewMode, calendarEvents } = useAppSelector((s) => s.leaves)
  const [users, setUsers] = useState<AppUser[]>([])

  const isManager = user?.role === 'admin' || user?.role === 'manager'
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchLeaves(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    if (isManager) usersApi.index().then((res) => setUsers(res.data.data))
  }, [isManager])

  useEffect(() => {
    if (viewMode !== 'calendar') return
    const start = new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10)
    const end = new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10)
    dispatch(
      fetchLeaveCalendar({
        start,
        end,
        employeeId: filters.employee_id ? Number(filters.employee_id) : isManager ? undefined : user?.id,
      }),
    )
  }, [dispatch, viewMode, filters.employee_id, isManager, user?.id, currentYear, currentMonth])

  const pendingCount = items.filter((l) => l.status === 'pending').length
  const approvedCount = items.filter((l) => l.status === 'approved').length

  const calendarEventsMapped = useMemo(
    () =>
      calendarEvents.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        backgroundColor: e.color,
        borderColor: e.color,
      })),
    [calendarEvents],
  )

  const viewBtn = (mode: 'table' | 'calendar') =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      viewMode === mode
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }`

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('leaves.title')}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {isManager ? t('leaves.subtitleManager') : t('leaves.subtitleEmployee')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportLeavesToExcel(items)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('leaves.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportLeavesToPdf(items, t('leaves.exportTitle'))}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('leaves.exportPdf')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(openLeaveForm())}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('leaves.requestLeave')}
          </button>
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label={t('leaves.kpiPending')} value={pendingCount} accent="amber" />
        <KpiCard label={t('leaves.kpiApproved')} value={approvedCount} accent="emerald" />
        <KpiCard label={t('leaves.kpiTotal')} value={items.length} accent="indigo" />
      </section>

      <div className="mt-6">
        <LeaveFiltersBar
          filters={filters}
          onChange={(f) => dispatch(setLeaveFilters(f))}
          showEmployeeFilter={isManager}
          users={users}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" className={viewBtn('table')} onClick={() => dispatch(setLeaveViewMode('table'))}>
          {t('leaves.viewTable')}
        </button>
        <button type="button" className={viewBtn('calendar')} onClick={() => dispatch(setLeaveViewMode('calendar'))}>
          {t('leaves.viewCalendar')}
        </button>
      </div>

      {status === 'loading' && <p className="mt-6 text-center text-slate-500">{t('common.loading')}</p>}

      {viewMode === 'calendar' && status !== 'loading' && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <FullCalendar
            plugins={[dayGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            events={calendarEventsMapped}
            height="auto"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listMonth' }}
          />
        </div>
      )}

      {viewMode === 'table' && status !== 'loading' && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {isManager && (
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                    {t('leaves.employee')}
                  </th>
                )}
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('leaves.typeLabel')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('leaves.dates')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('leaves.days')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('leaves.statusLabel')}
                </th>
                <th className="px-4 py-3 text-end text-xs font-medium uppercase text-slate-500">
                  {t('leaves.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {items.map((leave) => (
                <tr key={leave.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {isManager && (
                    <td className="px-4 py-3 text-sm">{leave.employee?.name ?? '—'}</td>
                  )}
                  <td className="px-4 py-3 text-sm">{t(`leaves.type.${leave.leave_type}`)}</td>
                  <td className="px-4 py-3 text-sm">
                    {leave.start_date} → {leave.end_date}
                  </td>
                  <td className="px-4 py-3 text-sm">{leave.day_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEAVE_STATUS_STYLES[leave.status]}`}
                    >
                      {t(`leaves.status.${leave.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    {isManager && leave.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => dispatch(approveLeave(leave.id))}
                          className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
                        >
                          {t('leaves.approve')}
                        </button>
                        <button
                          type="button"
                          onClick={() => dispatch(rejectLeave(leave.id))}
                          className="text-sm font-medium text-red-600 dark:text-red-400"
                        >
                          {t('leaves.reject')}
                        </button>
                      </div>
                    )}
                    {!isManager && leave.status === 'pending' && (
                      <span className="text-xs text-slate-500">{t('leaves.awaitingApproval')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="py-8 text-center text-slate-500">{t('leaves.empty')}</p>}
        </div>
      )}

      <LeaveFormModal />
    </div>
  )
}
