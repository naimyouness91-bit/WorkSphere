import { api } from './api'
import type { Attendance, AttendanceFilters, AttendanceReportEmployee } from '../types/attendance'

function filterParams(filters: AttendanceFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.employee_id) params.employee_id = filters.employee_id
  if (filters.status) params.status = filters.status
  if (filters.date) params.date = filters.date
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to
  return params
}

export const attendanceApi = {
  index: (filters: AttendanceFilters) =>
    api.get<{ data: Attendance[] }>('/attendances', { params: filterParams(filters) }),

  today: (employeeId?: number) =>
    api.get<{ data: Attendance | null }>('/attendances/today', {
      params: employeeId ? { employee_id: employeeId } : {},
    }),

  checkIn: () => api.post<{ message: string; data: Attendance }>('/attendances/check-in'),

  checkOut: () => api.post<{ message: string; data: Attendance }>('/attendances/check-out'),

  report: (year: number, month: number, employeeId?: number) =>
    api.get<{
      data: {
        year: number
        month: number
        workdays: number
        by_employee: AttendanceReportEmployee[]
        records: Attendance[]
      }
    }>('/attendances/report', {
      params: {
        year,
        month,
        ...(employeeId ? { employee_id: employeeId } : {}),
      },
    }),

  summary: (employeeId?: number, dateFrom?: string, dateTo?: string) =>
    api.get<{ data: { employee_id: number; total_working_hours: number } }>(
      '/attendances/summary',
      {
        params: {
          ...(employeeId ? { employee_id: employeeId } : {}),
          ...(dateFrom ? { date_from: dateFrom } : {}),
          ...(dateTo ? { date_to: dateTo } : {}),
        },
      },
    ),
}
