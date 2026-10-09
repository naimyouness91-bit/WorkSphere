export interface Employee {
  id: number
  name: string
  email: string
  phone: string | null
  department: string
  position: string
  hire_date: string
  created_at: string
  updated_at: string
}

export interface EmployeeFormData {
  name: string
  email: string
  phone: string
  department: string
  position: string
  hire_date: string
}

export const emptyEmployeeForm = (): EmployeeFormData => ({
  name: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  hire_date: new Date().toISOString().split('T')[0],
})
