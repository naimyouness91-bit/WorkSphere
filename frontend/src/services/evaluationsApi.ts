import { api } from './api'
import type {
  Evaluation,
  EvaluationFilters,
  EvaluationFormData,
  EvaluationSummary,
} from '../types/evaluation'

function filterParams(filters: EvaluationFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.department) params.department = filters.department
  if (filters.review_period) params.review_period = filters.review_period
  if (filters.status) params.status = filters.status
  if (filters.employee_id) params.employee_id = filters.employee_id
  return params
}

export const evaluationsApi = {
  index: (filters: EvaluationFilters) =>
    api.get<{ data: Evaluation[] }>('/evaluations', { params: filterParams(filters) }),

  summary: (filters: EvaluationFilters) =>
    api.get<{ data: EvaluationSummary }>('/evaluations/summary', {
      params: filterParams(filters),
    }),

  departments: () => api.get<{ data: string[] }>('/evaluations/departments'),

  show: (id: number) => api.get<{ data: Evaluation }>(`/evaluations/${id}`),

  store: (payload: EvaluationFormData) =>
    api.post<{ message: string; data: Evaluation }>('/evaluations', payload),

  update: (id: number, payload: Partial<EvaluationFormData>) =>
    api.put<{ message: string; data: Evaluation }>(`/evaluations/${id}`, payload),
}
