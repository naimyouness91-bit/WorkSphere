export type TaskStatus = 'pending' | 'in_progress' | 'done'

export interface TaskAssignee {
  id: number
  name: string
  email: string
}

export interface TaskProject {
  id: number
  title: string
  start_date?: string
  end_date?: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  description: string | null
  assigned_to: number | null
  due_date: string | null
  status: TaskStatus
  is_overdue: boolean
  project?: TaskProject
  assignee?: TaskAssignee | null
  dependency_ids?: number[]
  dependencies?: Array<{ id: number; title: string; status: TaskStatus }>
  can_start?: boolean
  created_at?: string
  updated_at?: string
}

export interface TaskFilters {
  project_id: string
  status: string
  assigned_to: string
  overdue_only: boolean
}

export interface TaskFormData {
  project_id: number
  title: string
  description: string
  assigned_to: number | null
  due_date: string | null
  status: TaskStatus
}

export type TaskViewMode = 'table' | 'kanban' | 'gantt'

export function emptyTaskFilters(): TaskFilters {
  return { project_id: '', status: '', assigned_to: '', overdue_only: false }
}

export function emptyTaskForm(): TaskFormData {
  return {
    project_id: 0,
    title: '',
    description: '',
    assigned_to: null,
    due_date: null,
    status: 'pending',
  }
}
