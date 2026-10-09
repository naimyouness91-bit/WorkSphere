export type LeaveType = 'sick' | 'vacation' | 'unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveEmployee {
  id: number
  name: string
  email: string
}

export interface Leave {
  id: number
  employee_id: number
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string | null
  status: LeaveStatus
  approver_id: number | null
  day_count: number
  employee?: LeaveEmployee
  approver?: { id: number; name: string } | null
  created_at?: string
}

export interface LeaveFilters {
  employee_id: string
  status: string
  leave_type: string
}

export interface LeaveFormData {
  leave_type: LeaveType
  start_date: string
  end_date: string
  reason: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  type: 'attendance' | 'leave'
  status: string
  color: string
}

export function emptyLeaveFilters(): LeaveFilters {
  return { employee_id: '', status: '', leave_type: '' }
}

export function emptyLeaveForm(): LeaveFormData {
  const today = new Date().toISOString().slice(0, 10)
  return { leave_type: 'vacation', start_date: today, end_date: today, reason: '' }
}
