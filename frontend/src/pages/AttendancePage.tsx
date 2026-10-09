import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import listPlugin from '@fullcalendar/list'
import AttendanceFiltersBar from '../components/attendance/AttendanceFiltersBar'
import KpiCard from '../components/KpiCard'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { usersApi } from '../services/usersApi'
import {
  checkIn,
  checkOut,
  fetchAttendanceReport,
  fetchAttendances,
  fetchTodayAttendance,
  setAttendanceFilters,
  setAttendanceViewMode,
} from '../store/attendanceSlice'
import { fetchLeaveCalendar } from '../store/leavesSlice'
import type { AppUser } from '../types/userList'
import { ATTENDANCE_STATUS_STYLES } from '../utils/attendanceBadges'
import { exportAttendanceToExcel, exportAttendanceToPdf } from '../utils/exportAttendanceLeave'

export default function AttendancePage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, today, report, status, mutationStatus, filters, viewMode } = useAppSelector(
    (s) => s.attendance,
  )
  const { calendarEvents } = useAppSelector((s) => s.leaves)
  const [users, setUsers] = useState<AppUser[]>([])

  const isManager = user?.role === 'admin' || user?.role === 'manager'
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchAttendances(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    dispatch(fetchTodayAttendance(isManager ? undefined : user?.id))
    if (isManager) usersApi.index().then((res) => setUsers(res.data.data))
    dispatch(
      fetchAttendanceReport({
        year: currentYear,
        month: currentMonth + 1,
        employeeId: isManager ? undefined : user?.id,
      }),
    )
  }, [dispatch, isManager, user?.id, currentYear, currentMonth])

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

  const canCheckIn = !today?.check_in_time
  const canCheckOut = today?.check_in_time && !today?.check_out_time

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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('attendance.title')}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('attendance.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportAttendanceToExcel(items)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('attendance.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportAttendanceToPdf(items, t('attendance.exportTitle'))}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('attendance.exportPdf')}
          </button>
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('attendance.kpiTodayStatus')}
          value={today ? t(`attendance.status.${today.status}`) : t('attendance.notCheckedIn')}
          accent="indigo"
        />
        <KpiCard
          label={t('attendance.kpiHoursToday')}
          value={today?.working_hours?.toFixed(2) ?? '0'}
          accent="emerald"
        />
        {isManager && report[0] && (
          <KpiCard
            label={t('attendance.kpiMonthHours')}
            value={report[0].total_working_hours}
            accent="amber"
          />
        )}
        <KpiCard label={t('attendance.kpiRecords')} value={items.length} accent="violet" />
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canCheckIn || mutationStatus === 'loading'}
          onClick={() => dispatch(checkIn())}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {t('attendance.checkIn')}
        </button>
        <button
          type="button"
          disabled={!canCheckOut || mutationStatus === 'loading'}
          onClick={() => dispatch(checkOut())}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {t('attendance.checkOut')}
        </button>
        {today?.check_in_time && (
          <span className="self-center text-sm text-slate-500">
            {t('attendance.checkedInAt')}: {new Date(today.check_in_time).toLocaleTimeString()}
            {today.check_out_time &&
              ` · ${t('attendance.checkedOutAt')}: ${new Date(today.check_out_time).toLocaleTimeString()}`}
          </span>
        )}
      </div>

      <div className="mt-6">
        <AttendanceFiltersBar
          filters={filters}
          onChange={(f) => dispatch(setAttendanceFilters(f))}
          showEmployeeFilter={isManager}
          users={users}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" className={viewBtn('table')} onClick={() => dispatch(setAttendanceViewMode('table'))}>
          {t('attendance.viewTable')}
        </button>
        <button
          type="button"
          className={viewBtn('calendar')}
          onClick={() => dispatch(setAttendanceViewMode('calendar'))}
        >
          {t('attendance.viewCalendar')}
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
          <p className="mt-3 text-xs text-slate-500">{t('attendance.calendarLegend')}</p>
        </div>
      )}

      {viewMode === 'table' && status !== 'loading' && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {isManager && (
                  <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                    {t('attendance.employee')}
                  </th>
                )}
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('attendance.date')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('attendance.checkIn')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('attendance.checkOut')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('attendance.hours')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('attendance.statusLabel')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {isManager && (
                    <td className="px-4 py-3 text-sm">{row.employee?.name ?? '—'}</td>
                  )}
                  <td className="px-4 py-3 text-sm">{row.date}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums">{row.working_hours.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ATTENDANCE_STATUS_STYLES[row.status]}`}
                    >
                      {t(`attendance.status.${row.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-8 text-center text-slate-500">{t('attendance.empty')}</p>
          )}
        </div>
      )}
    </div>
  )
}
