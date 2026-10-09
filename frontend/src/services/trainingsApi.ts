import { api } from './api'
import type { Training, TrainingFilters, TrainingFormData } from '../types/training'

function filterParams(filters: TrainingFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.employee_id) params.employee_id = filters.employee_id
  if (filters.status) params.status = filters.status
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to
  return params
}

export const trainingsApi = {
  index: (filters: TrainingFilters) =>
    api.get<{ data: Training[] }>('/trainings', { params: filterParams(filters) }),

  show: (id: number) => api.get<{ data: Training }>(`/trainings/${id}`),

  store: (payload: TrainingFormData) =>
    api.post<{ message: string; data: Training }>('/trainings', payload),

  update: (id: number, payload: Partial<TrainingFormData>) =>
    api.put<{ message: string; data: Training }>(`/trainings/${id}`, payload),

  destroy: (id: number) =>
    api.delete<{ message: string }>(`/trainings/${id}`),
}
