import { api } from './api'
import type { Skill, SkillFilters, SkillFormData } from '../types/skill'

function filterParams(filters: SkillFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.employee_id) params.employee_id = filters.employee_id
  if (filters.level) params.level = filters.level
  return params
}

export const skillsApi = {
  index: (filters: SkillFilters) =>
    api.get<{ data: Skill[] }>('/skills', { params: filterParams(filters) }),

  show: (id: number) => api.get<{ data: Skill }>(`/skills/${id}`),

  store: (payload: SkillFormData) =>
    api.post<{ message: string; data: Skill }>('/skills', payload),

  update: (id: number, payload: Partial<SkillFormData>) =>
    api.put<{ message: string; data: Skill }>(`/skills/${id}`, payload),

  destroy: (id: number) =>
    api.delete<{ message: string }>(`/skills/${id}`),
}
