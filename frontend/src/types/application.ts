export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interviewed'
  | 'hired'
  | 'rejected'
  | 'pending'

export interface Application {
  id: number
  job_id: number
  user_id: number | null
  candidate_name: string
  candidate_email: string
  resume_path: string
  original_resume_filename: string
  status: ApplicationStatus
  job?: {
    id: number
    title: string
    department: string
    location: string
    status: string
  }
  created_at?: string
  updated_at?: string
}

export interface ApplicationApplyData {
  job_id: number
  candidate_name: string
  candidate_email: string
  resume: File
}

export interface ApplicationFilters {
  job_id: string
  status: string
  department: string
}

export const emptyApplicationFilters = (): ApplicationFilters => ({
  job_id: '',
  status: '',
  department: '',
})
