import { api } from './api'
import type { AccountingOverview, FinancialTransaction, Invoice } from '../types/accounting'
import type { Budget } from '../types/budget'
import type { ExpenseSubmitData } from '../types/expense'
import type { Expense } from '../types/expense'

export const accountingApi = {
  overview: () => api.get<{ data: AccountingOverview }>('/accounting/overview'),

  getBudgets: (params?: { department?: string; fiscal_year?: number; period?: string }) =>
    api.get<{ data: Budget[] }>('/accounting/budgets', { params }),

  addExpense: (payload: ExpenseSubmitData) =>
    api.post<{ data: Expense; message: string }>('/accounting/expenses', payload),

  getInvoices: (params?: { status?: string }) =>
    api.get<{ data: Invoice[] }>('/accounting/invoices', { params }),

  createInvoice: (payload: {
    client_id: number
    amount: number
    due_date: string
    notes?: string
  }) => api.post<{ data: Invoice; message: string }>('/accounting/invoices', payload),

  updateInvoiceStatus: (id: number, status: string) =>
    api.patch<{ data: Invoice; message: string }>(`/accounting/invoices/${id}/status`, { status }),

  getTransactions: (params?: { type?: string }) =>
    api.get<{ data: FinancialTransaction[] }>('/accounting/transactions', { params }),

  export: (type?: string) =>
    api.get<{ data: Record<string, unknown>[] }>('/accounting/export', { params: type ? { type } : undefined }),
}
