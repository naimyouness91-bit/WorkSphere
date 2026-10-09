export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

export interface Skill {
  id: number
  name: string
  description: string | null
  employee_id: number
  level: SkillLevel
  employee?: {
    id: number
    name: string
    email: string
  }
}

export interface SkillFormData {
  name: string
  description: string
  employee_id: number
  level: SkillLevel
}

export interface SkillFilters {
  employee_id: string
  level: string
}

export const emptySkillFilters = (): SkillFilters => ({
  employee_id: '',
  level: '',
})

export const emptySkillForm = (): SkillFormData => ({
  name: '',
  description: '',
  employee_id: 0,
  level: 'beginner',
})
