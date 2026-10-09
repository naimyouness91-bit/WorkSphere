export type EvaluationStatus = 'draft' | 'submitted' | 'finalized'

export interface EvaluationUser {
  id: number
  name: string
  email: string
}

export interface Evaluation {
  id: number
  employee_id: number
  evaluator_id: number
  review_period: string
  score: number
  comments: string | null
  status: EvaluationStatus
  employee?: EvaluationUser
  evaluator?: EvaluationUser
  created_at?: string
  updated_at?: string
}

export interface EvaluationFormData {
  employee_id: number
  review_period: string
  score: number
  comments: string
  status: EvaluationStatus
}

export interface EvaluationFilters {
  department: string
  review_period: string
  status: string
  employee_id: string
}

export interface EmployeeAverage {
  employee_id: number
  employee_name: string
  employee_email: string
  average_score: number
  evaluation_count: number
}

export interface EvaluationSummary {
  employee_averages: EmployeeAverage[]
  overall_average: number
  top_performers: EmployeeAverage[]
  needs_improvement: EmployeeAverage[]
}

export const emptyEvaluationFilters = (): EvaluationFilters => ({
  department: '',
  review_period: '',
  status: '',
  employee_id: '',
})

export const emptyEvaluationForm = (): EvaluationFormData => ({
  employee_id: 0,
  review_period: '',
  score: 3,
  comments: '',
  status: 'draft',
})
