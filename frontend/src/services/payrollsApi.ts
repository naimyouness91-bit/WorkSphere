import { api } from './api'
import type { PayrollFilters, PayrollFormData } from '../types/payroll'

function filterParams(filters: PayrollFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.employee_id) {
    params.employee_id = filters.employee_id
  }
  if (filters.date_from) {
    params.date_from = filters.date_from
  }
  if (filters.date_to) {
    params.date_to = filters.date_to
  }
  return params
}

export const payrollsApi = {
  index: (filters: PayrollFilters = { employee_id: '', date_from: '', date_to: '' }) =>
    api.get<{ data: import('../types/payroll').PayrollRecord[] }>('/payrolls', {
      params: filterParams(filters),
    }),

  summary: (filters: PayrollFilters = { employee_id: '', date_from: '', date_to: '' }) =>
    api.get<{ data: import('../types/payroll').PayrollSummary }>('/payrolls/summary', {
      params: filterParams(filters),
    }),

  show: (id: number) =>
    api.get<{ data: import('../types/payroll').PayrollRecord }>(`/payrolls/${id}`),

  store: (payload: PayrollFormData) =>
    api.post<{ message: string; data: import('../types/payroll').PayrollRecord }>(
      '/payrolls',
      payload,
    ),

  update: (id: number, payload: Partial<PayrollFormData>) =>
    api.put<{ message: string; data: import('../types/payroll').PayrollRecord }>(
      `/payrolls/${id}`,
      payload,
    ),
}
