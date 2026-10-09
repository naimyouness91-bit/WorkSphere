export type ReportType = 'requests' | 'payroll' | 'attendance' | 'finance' | 'performance' | 'hr'
export type ReportModule = ReportType | 'all'
export type ScheduleFrequency = 'weekly' | 'monthly'

export interface ReportFilters {
  module: ReportModule
  department: string
  date_from: string
  date_to: string
}

export function emptyReportFilters(): ReportFilters {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  return {
    module: 'all',
    department: '',
    date_from: from.toISOString().slice(0, 10),
    date_to: now.toISOString().slice(0, 10),
  }
}

export interface ReportKpis {
  monthly_requests: number
  requests_trend_percent: number
  payroll_cost: number
  attendance_rate: number
  budget_usage_percent: number
}

export interface ReportStatistics {
  filters: ReportFilters
  kpis: ReportKpis
  comparative?: {
    performance_vs_attendance: {
      employee_id: number
      name: string
      performance_score: number
      attendance_rate: number
    }[]
  }
  requests?: {
    by_status: { status: string; count: number }[]
    by_type: { type: string; count: number }[]
    over_time: { month: string; count: number }[]
  }
  payroll?: {
    evolution: { month: string; total: number; count: number }[]
    by_department: { department: string; total: number }[]
    total_cost: number
  }
  attendance?: {
    by_status: { status: string; count: number }[]
    over_time: { month: string; present: number; absent: number; rate: number }[]
    rate: number
  }
  finance?: {
    expenses_by_category: { category: string; total: number }[]
    budget: {
      allocated: number
      spent: number
      remaining: number
      usage_percent: number
    }
    by_department: { department: string; allocated: number; spent: number; remaining: number }[]
  }
  performance?: {
    score_distribution: { range: string; count: number }[]
    top_performers: { employee_id: number; name: string; average_score: number; count: number }[]
    average_score: number
  }
}

export interface DrillDownItem {
  id: number
  [key: string]: string | number | null | undefined
}

export interface SavedReport {
  id: number
  title: string
  description: string | null
  type: ReportType
  generated_by: number
  generated_at: string
  date_from: string | null
  date_to: string | null
  department: string | null
  payload?: ReportStatistics
  is_scheduled: boolean
  schedule_frequency: ScheduleFrequency | null
  next_run_at: string | null
  generator?: { id: number; name: string; email: string }
}

export interface ReportFormData {
  title: string
  description?: string
  type: ReportType
  date_from?: string
  date_to?: string
  department?: string
  is_scheduled?: boolean
  schedule_frequency?: ScheduleFrequency
}
