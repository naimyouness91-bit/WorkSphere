import { api } from './api'
import type { Task, TaskFilters, TaskFormData } from '../types/task'

function filterParams(filters: TaskFilters): Record<string, string | boolean> {
  const params: Record<string, string | boolean> = {}
  if (filters.project_id) params.project_id = filters.project_id
  if (filters.status) params.status = filters.status
  if (filters.assigned_to) params.assigned_to = filters.assigned_to
  if (filters.overdue_only) params.overdue_only = true
  return params
}

export const tasksApi = {
  index: (filters: TaskFilters) =>
    api.get<{ data: Task[] }>('/tasks', { params: filterParams(filters) }),

  show: (id: number) => api.get<{ data: Task }>(`/tasks/${id}`),

  store: (payload: TaskFormData) =>
    api.post<{ message: string; data: Task }>('/tasks', payload),

  update: (id: number, payload: Partial<TaskFormData>) =>
    api.put<{ message: string; data: Task }>(`/tasks/${id}`, payload),

  complete: (id: number) =>
    api.patch<{ message: string; data: Task }>(`/tasks/${id}/complete`),

  destroy: (id: number) => api.delete<{ message: string }>(`/tasks/${id}`),
}
