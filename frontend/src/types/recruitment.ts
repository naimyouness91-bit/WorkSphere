export type CandidateStatus = 'applied' | 'shortlisted' | 'interviewed' | 'hired' | 'rejected'

export type OnboardingTaskStatus = 'pending' | 'completed' | 'overdue'

export interface JobPosting {
  id: number
  title: string
  description: string
  requirements: string | null
  department: string
  location: string
  status: string
  candidates_count?: number
  created_at?: string
}

export interface Candidate {
  id: number
  job_id: number
  name: string
  email: string
  cv_file: string
  original_resume_filename: string
  status: CandidateStatus
  job_posting?: {
    id: number
    title: string
    department: string
    status: string
  }
  created_at?: string
}

export interface OnboardingTask {
  id: number
  employee_id: number
  task_title: string
  description: string | null
  due_date: string
  status: OnboardingTaskStatus
  completed_at?: string | null
  employee?: { id: number; name: string; email: string }
}

export interface RecruitmentStats {
  open_positions: number
  candidates_in_pipeline: number
  onboarding_tasks_pending: number
}

export interface RecruitmentOverview {
  stats: RecruitmentStats
  departments: string[]
  can_manage: boolean
  pipeline_stages: string[]
}
