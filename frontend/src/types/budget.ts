export type BudgetStatus = 'active' | 'exceeded' | 'closed'

export type BudgetPeriod = 'monthly' | 'yearly'

export interface Budget {
  id: number
  department: string
  allocated_amount: number
  spent_amount: number
  remaining_amount: number
  usage_percent: number
  status?: BudgetStatus
  period: BudgetPeriod
  period_year: number
  period_month: number | null
  created_by?: number | null
  created_at?: string
  updated_at?: string
}

export interface BudgetFilters {
  department: string
  period: BudgetPeriod | ''
}

export function emptyBudgetFilters(): BudgetFilters {
  return { department: '', period: '' }
}

export interface BudgetFormData {
  department: string
  allocated_amount: number
  period: BudgetPeriod
  period_year: number
  period_month: number | null
}

export interface FinanceSummary {
  kpis: {
    total_expenses: number
    pending_expenses: number
    total_budget_allocated: number
    total_remaining_funds: number
  }
  expenses_by_category: { category: string; total: number }[]
  budget_usage_by_department: {
    department: string
    allocated: number
    spent: number
    remaining: number
  }[]
}
