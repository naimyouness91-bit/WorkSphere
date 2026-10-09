import { api } from './api'
import type { Job, JobFilters, JobFormData } from '../types/job'

function filterParams(filters: JobFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.department) params.department = filters.department
  if (filters.status) params.status = filters.status
  return params
}

export const jobsApi = {
  index: (filters: JobFilters = { department: '', status: '' }) =>
    api.get<{ data: Job[] }>('/jobs', { params: filterParams(filters) }),

  show: (id: number) => api.get<{ data: Job }>(`/jobs/${id}`),

  store: (payload: JobFormData) =>
    api.post<{ message: string; data: Job }>('/jobs', payload),

  update: (id: number, payload: Partial<JobFormData>) =>
    api.put<{ message: string; data: Job }>(`/jobs/${id}`, payload),

  destroy: (id: number) => api.delete<{ message: string }>(`/jobs/${id}`),
}
