import { api } from './api'
import type { Budget, BudgetFilters, BudgetFormData, FinanceSummary } from '../types/budget'

function filterParams(filters: BudgetFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.department) params.department = filters.department
  if (filters.period) params.period = filters.period
  return params
}

export const budgetsApi = {
  index: (filters: BudgetFilters) =>
    api.get<{ data: Budget[] }>('/budgets', { params: filterParams(filters) }),

  departments: () => api.get<{ data: string[] }>('/budgets/departments'),

  store: (payload: BudgetFormData) =>
    api.post<{ message: string; data: Budget }>('/budgets', payload),

  update: (id: number, payload: Partial<BudgetFormData>) =>
    api.put<{ message: string; data: Budget }>(`/budgets/${id}`, payload),

  destroy: (id: number) => api.delete<{ message: string }>(`/budgets/${id}`),
}

export const financeApi = {
  summary: () => api.get<{ data: FinanceSummary }>('/finance/summary'),
  report: (year?: number) =>
    api.get<{ data: unknown }>('/finance/report', { params: year ? { year } : {} }),
}
