export type TrainingStatus = 'scheduled' | 'completed'

export interface TrainingUser {
  id: number
  name: string
  email: string
}

export interface Training {
  id: number
  title: string
  description: string | null
  start_date: string
  end_date: string
  trainer_id: number
  status: TrainingStatus
  trainer?: TrainingUser
  assignees?: TrainingUser[]
  assignee_ids?: number[]
}

export interface TrainingFormData {
  title: string
  description: string
  start_date: string
  end_date: string
  trainer_id: number
  status: TrainingStatus
  assignee_ids: number[]
}

export interface TrainingFilters {
  employee_id: string
  status: string
  date_from: string
  date_to: string
}

export const emptyTrainingFilters = (): TrainingFilters => ({
  employee_id: '',
  status: '',
  date_from: '',
  date_to: '',
})

export const emptyTrainingForm = (): TrainingFormData => ({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  trainer_id: 0,
  status: 'scheduled',
  assignee_ids: [],
})
