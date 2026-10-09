import { api } from './api'
import type { Project, ProjectFilters, ProjectFormData } from '../types/project'

function filterParams(filters: ProjectFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.status) params.status = filters.status
  if (filters.manager_id) params.manager_id = filters.manager_id
  if (filters.search) params.search = filters.search
  return params
}

export const projectsApi = {
  index: (filters: ProjectFilters) =>
    api.get<{ data: Project[] }>('/projects', { params: filterParams(filters) }),

  show: (id: number) => api.get<{ data: Project }>(`/projects/${id}`),

  store: (payload: ProjectFormData) =>
    api.post<{ message: string; data: Project }>('/projects', payload),

  update: (id: number, payload: Partial<ProjectFormData>) =>
    api.put<{ message: string; data: Project }>(`/projects/${id}`, payload),

  destroy: (id: number) => api.delete<{ message: string }>(`/projects/${id}`),
}
