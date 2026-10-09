import { api } from './api'
import type {
  Expense,
  ExpenseFilters,
  ExpenseStatusUpdate,
  ExpenseSubmitData,
} from '../types/expense'

function filterParams(filters: ExpenseFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.status) params.status = filters.status
  if (filters.category) params.category = filters.category
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to
  return params
}

export const expensesApi = {
  index: (filters: ExpenseFilters) =>
    api.get<{ data: Expense[] }>('/expenses', { params: filterParams(filters) }),

  store: (payload: ExpenseSubmitData) =>
    api.post<{ message: string; data: Expense }>('/expenses', payload),

  updateStatus: (id: number, payload: ExpenseStatusUpdate) =>
    api.put<{ message: string; data: Expense }>(`/expenses/${id}`, payload),

  destroy: (id: number) => api.delete<{ message: string }>(`/expenses/${id}`),
}
