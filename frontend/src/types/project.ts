export type ProjectStatus = 'active' | 'completed' | 'on_hold'

export interface ProjectManager {
  id: number
  name: string
  email: string
}

export interface Project {
  id: number
  title: string
  description: string | null
  start_date: string
  end_date: string
  manager_id: number
  status: ProjectStatus
  progress_percent: number
  tasks_count?: number
  completed_tasks_count?: number
  manager?: ProjectManager
  created_at?: string
  updated_at?: string
}

export interface ProjectFilters {
  status: string
  manager_id: string
  search: string
}

export interface ProjectFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  manager_id: number
  status: ProjectStatus
}

export function emptyProjectFilters(): ProjectFilters {
  return { status: '', manager_id: '', search: '' }
}

export function emptyProjectForm(): ProjectFormData {
  const today = new Date().toISOString().slice(0, 10)
  return {
    title: '',
    description: '',
    start_date: today,
    end_date: today,
    manager_id: 0,
    status: 'active',
  }
}
