import type { Employee } from './employee'

export interface PayrollRecord {
  id: number
  employee_id: number
  base_salary: number
  bonuses: number
  deductions: number
  net_salary: number
  pay_date: string
  employee?: Pick<Employee, 'id' | 'name' | 'email' | 'department' | 'position'>
  created_at?: string
  updated_at?: string
}

export interface PayrollFormData {
  employee_id: number
  base_salary: number
  bonuses: number
  deductions: number
  pay_date: string
}

export interface PayrollFilters {
  employee_id: string
  date_from: string
  date_to: string
}

export interface PayrollSummary {
  total_payroll_cost: number
  average_salary: number
  record_count: number
}

export const emptyPayrollFilters = (): PayrollFilters => ({
  employee_id: '',
  date_from: '',
  date_to: '',
})

export const emptyPayrollForm = (): PayrollFormData => ({
  employee_id: 0,
  base_salary: 0,
  bonuses: 0,
  deductions: 0,
  pay_date: new Date().toISOString().slice(0, 10),
})
