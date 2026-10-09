export type InvoiceStatus = 'pending' | 'paid' | 'overdue'
export type TransactionType = 'income' | 'expense'
export type BudgetStatus = 'active' | 'exceeded' | 'closed'

export interface FinanceStats {
  total_expenses: number
  pending_invoices: number
  budget_utilization: number
  overdue_invoices: number
}

export interface AccountingBudgetRow {
  id: number
  department: string
  allocated_amount: number
  spent_amount: number
  remaining_amount: number
  usage_percent: number
  status: BudgetStatus
  period_year: number
}

export interface Invoice {
  id: number
  invoice_number: string
  client_id: number
  amount: number
  due_date: string
  status: InvoiceStatus
  paid_at: string | null
  notes: string | null
  client?: { id: number; name: string; company: string }
  creator?: { id: number; name: string } | null
  created_at?: string
}

export interface FinancialTransaction {
  id: number
  type: TransactionType
  amount: number
  transaction_date: string
  reference: string
  reference_type: string | null
  reference_id: number | null
  description: string | null
  creator?: { id: number; name: string } | null
}

export interface AccountingOverview {
  stats: FinanceStats
  budgets: AccountingBudgetRow[]
  expenses_by_category: { category: string; total: number }[]
  income_vs_expenses: { income: number; expenses: number }
  kpis: {
    total_expenses: number
    pending_invoices: number
    overdue_invoices: number
    budget_utilization: number
  }
}
