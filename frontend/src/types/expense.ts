export type ExpenseCategory = 'hr' | 'it' | 'operations' | 'other'
export type ExpenseStatus = 'pending' | 'approved' | 'rejected'

export interface ExpenseUserRef {
  id: number
  name: string
  email?: string
}

export interface Expense {
  id: number
  title: string
  description: string | null
  amount: number
  category: ExpenseCategory
  date: string
  department: string
  employee_id: number
  status: ExpenseStatus
  approver_id: number | null
  employee?: ExpenseUserRef
  approver?: { id: number; name: string } | null
  created_at?: string
  updated_at?: string
}

export interface ExpenseFilters {
  status: ExpenseStatus | ''
  category: ExpenseCategory | ''
  date_from: string
  date_to: string
}

export function emptyExpenseFilters(): ExpenseFilters {
  return { status: '', category: '', date_from: '', date_to: '' }
}

export interface ExpenseSubmitData {
  title: string
  description?: string
  amount: number
  category: ExpenseCategory
  date: string
}

export interface ExpenseStatusUpdate {
  status: 'approved' | 'rejected'
}
