export interface PayrollKpis {
  total_payroll_cost: number
  average_salary: number
  record_count: number
}

export interface TrainingSkillsKpis {
  completed_trainings: number
  total_trainings: number
  average_skill_level: number
  total_skills: number
}

export interface EmployeePerformanceRow {
  employee_id: number
  employee_name: string
  employee_email: string
  average_score: number
  evaluation_count: number
}

export interface EvaluationKpis {
  average_performance_score: number
  top_performers: EmployeePerformanceRow[]
  needs_improvement: EmployeePerformanceRow[]
  total_evaluations: number
}

export interface RecruitmentKpis {
  open_jobs: number
  applications_received: number
  hires: number
  pending_applications: number
}

export interface ProjectKpis {
  active_projects: number
  tasks_completed: number
  overdue_tasks: number
  total_tasks: number
}

export interface TicketKpis {
  open_tickets: number
  average_resolution_hours: number
  total_tickets: number
}

export interface AttendanceKpis {
  attendance_rate: number
  average_working_hours: number
  approved_leaves_count: number
  present_employees: number
}

export interface FinanceKpis {
  total_expenses: number
  pending_expenses: number
  total_budget_allocated: number
  total_remaining_funds: number
}

export interface ExpenseCategoryTotal {
  category: string
  total: number
}

export interface BudgetDepartmentUsage {
  department: string
  allocated: number
  spent: number
  remaining: number
}

export interface AuditKpis {
  actions_logged_today: number
  most_active_users: {
    user_id: number
    name: string | null
    email: string | null
    action_count: number
  }[]
  top_modules: {
    module: string
    change_count: number
  }[]
}

export interface SecurityAlert {
  type: string
  severity: 'high' | 'medium' | 'low'
  message: string
  count?: number
}

export interface IntegrationKpis {
  active_integrations: number
  total_integrations: number
  last_sync_at: string | null
}

export interface DashboardKpis {
  total_employees: number
  total_requests: number
  acceptance_rate: number
}

export interface StatusCount {
  status: string
  count: number
}

export interface TypeCount {
  type: string
  count: number
}

export interface TimeSeriesPoint {
  date: string
  count: number
}

export interface DashboardAnalytics {
  kpis: DashboardKpis
  payroll_kpis: PayrollKpis
  training_skills_kpis: TrainingSkillsKpis
  evaluation_kpis: EvaluationKpis
  recruitment_kpis: RecruitmentKpis
  project_kpis: ProjectKpis
  ticket_kpis: TicketKpis
  attendance_kpis: AttendanceKpis
  finance_kpis: FinanceKpis
  expenses_by_category: ExpenseCategoryTotal[]
  budget_usage_by_department: BudgetDepartmentUsage[]
  audit_kpis: AuditKpis
  security_alerts: SecurityAlert[]
  integration_kpis: IntegrationKpis
  requests_by_status: StatusCount[]
  requests_by_type: TypeCount[]
  requests_over_time: TimeSeriesPoint[]
}

export interface DashboardAnalyticsResponse {
  data: DashboardAnalytics
}
