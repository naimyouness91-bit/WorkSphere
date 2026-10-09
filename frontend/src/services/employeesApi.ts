import { api } from './api'
import type { Employee, EmployeeFormData } from '../types/employee'

interface EmployeeResponse {
  message: string
  data: Employee
}

interface EmployeesListResponse {
  data: Employee[]
}

export const employeesApi = {
  index: () => api.get<EmployeesListResponse>('/employees'),

  store: (payload: EmployeeFormData) =>
    api.post<EmployeeResponse>('/employees', payload),

  update: (id: number, payload: EmployeeFormData) =>
    api.put<EmployeeResponse>(`/employees/${id}`, payload),

  destroy: (id: number) =>
    api.delete<{ message: string }>(`/employees/${id}`),
}
