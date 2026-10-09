import { api } from './api'
import type { CalendarEvent, Leave, LeaveFilters, LeaveFormData } from '../types/leave'

function filterParams(filters: LeaveFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.employee_id) params.employee_id = filters.employee_id
  if (filters.status) params.status = filters.status
  if (filters.leave_type) params.leave_type = filters.leave_type
  return params
}

export const leavesApi = {
  index: (filters: LeaveFilters) =>
    api.get<{ data: Leave[] }>('/leaves', { params: filterParams(filters) }),

  store: (payload: LeaveFormData) =>
    api.post<{ message: string; data: Leave }>('/leaves', payload),

  updateStatus: (id: number, status: 'approved' | 'rejected') =>
    api.put<{ message: string; data: Leave }>(`/leaves/${id}`, { status }),

  destroy: (id: number) => api.delete<{ message: string }>(`/leaves/${id}`),

  calendar: (start: string, end: string, employeeId?: number) =>
    api.get<{ data: CalendarEvent[] }>('/leaves/calendar', {
      params: {
        start,
        end,
        ...(employeeId ? { employee_id: employeeId } : {}),
      },
    }),
}
