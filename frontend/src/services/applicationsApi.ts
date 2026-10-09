import { api } from './api'
import type { Application, ApplicationFilters, ApplicationStatus } from '../types/application'

function filterParams(filters: ApplicationFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.job_id) params.job_id = filters.job_id
  if (filters.status) params.status = filters.status
  if (filters.department) params.department = filters.department
  return params
}

export const applicationsApi = {
  index: (filters: ApplicationFilters) =>
    api.get<{ data: Application[] }>('/applications', { params: filterParams(filters) }),

  show: (id: number) => api.get<{ data: Application }>(`/applications/${id}`),

  store: (formData: FormData) =>
    api.post<{ message: string; data: Application }>('/applications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateStatus: (id: number, status: ApplicationStatus) =>
    api.put<{ message: string; data: Application }>(`/applications/${id}`, { status }),

  destroy: (id: number) => api.delete<{ message: string }>(`/applications/${id}`),

  downloadResume: (id: number) =>
    api.get<Blob>(`/applications/${id}/resume`, { responseType: 'blob' }),
}
