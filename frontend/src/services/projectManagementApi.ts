import { api } from './api'
import type { ProjectOverview, Milestone, ProjectHistoryEntry } from '../types/projectManagement'
import type { Task, TaskStatus } from '../types/task'

export const projectManagementApi = {
  overview: (projectId: number) =>
    api.get<{ data: ProjectOverview }>(`/projects/${projectId}/overview`),

  board: (projectId: number) =>
    api.get<{ data: { pending: Task[]; in_progress: Task[]; done: Task[] } }>(
      `/projects/${projectId}/board`,
    ),

  history: (projectId: number) =>
    api.get<{ data: ProjectHistoryEntry[] }>(`/projects/${projectId}/history`),

  exportPlan: (projectId: number) =>
    api.get<{ data: Record<string, unknown> }>(`/projects/${projectId}/export`),

  milestones: (projectId: number) =>
    api.get<{ data: Milestone[] }>(`/projects/${projectId}/milestones`),

  addMilestone: (projectId: number, payload: { title: string; target_date: string }) =>
    api.post(`/projects/${projectId}/milestones`, payload),

  updateMilestone: (
    projectId: number,
    milestoneId: number,
    payload: Partial<{ title: string; target_date: string; status: string }>,
  ) => api.put(`/projects/${projectId}/milestones/${milestoneId}`, payload),

  addTask: (payload: Record<string, unknown>) =>
    api.post<{ data: Task }>('/tasks', payload),

  updateTaskStatus: (taskId: number, status: TaskStatus) =>
    api.patch<{ data: Task }>(`/tasks/${taskId}/status`, { status }),
}
