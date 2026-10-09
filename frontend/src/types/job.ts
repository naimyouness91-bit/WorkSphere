export type JobStatus = 'open' | 'closed'

export interface Job {
  id: number
  title: string
  description: string
  department: string
  location: string
  status: JobStatus
  applications_count?: number
  created_at?: string
  updated_at?: string
}

export interface JobFormData {
  title: string
  description: string
  department: string
  location: string
  status: JobStatus
}

export interface JobFilters {
  department: string
  status: string
}

export const emptyJobFilters = (): JobFilters => ({
  department: '',
  status: '',
})

export const emptyJobForm = (): JobFormData => ({
  title: '',
  description: '',
  department: '',
  location: '',
  status: 'open',
})
