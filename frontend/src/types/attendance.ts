export type AttendanceStatus = 'present' | 'absent' | 'late'

export interface AttendanceEmployee {
  id: number
  name: string
  email: string
}

export interface Attendance {
  id: number
  employee_id: number
  date: string
  check_in_time: string | null
  check_out_time: string | null
  status: AttendanceStatus
  working_minutes: number | null
  working_hours: number
  notes: string | null
  employee?: AttendanceEmployee
  created_at?: string
}

export interface AttendanceFilters {
  employee_id: string
  status: string
  date: string
  date_from: string
  date_to: string
}

export interface AttendanceReportEmployee {
  employee_id: number
  employee_name: string
  days_present: number
  days_late: number
  days_absent: number
  total_working_hours: number
}

export function emptyAttendanceFilters(): AttendanceFilters {
  return { employee_id: '', status: '', date: '', date_from: '', date_to: '' }
}
