import type { Project } from './project'
import type { Task, TaskStatus } from './task'

export type MilestoneStatus = 'pending' | 'completed' | 'missed'

export interface Milestone {
  id: number
  project_id: number
  title: string
  target_date: string
  status: MilestoneStatus
  is_upcoming?: boolean
}

export interface ProjectBoard {
  pending: Task[]
  in_progress: Task[]
  done: Task[]
}

export interface ProjectOverview {
  project: Project
  board: ProjectBoard
  milestones: Milestone[]
}

export interface ProjectHistoryEntry {
  id: number
  action: string
  description: string
  user_name: string | null
  meta: Record<string, unknown> | null
  created_at: string | null
}

export interface ProjectManagementStats {
  active_projects: number
  completed_tasks: number
  upcoming_milestones: number
}

export const KANBAN_COLUMNS: { id: TaskStatus; labelKey: string }[] = [
  { id: 'pending', labelKey: 'projectMgmt.kanban.todo' },
  { id: 'in_progress', labelKey: 'projectMgmt.kanban.inProgress' },
  { id: 'done', labelKey: 'projectMgmt.kanban.done' },
]
