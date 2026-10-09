export type UserRole = 'admin' | 'manager' | 'employee'
export type UserLocale = 'en' | 'fr' | 'ar'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  locale: UserLocale
  email_verified_at: string | null
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  message: string
  user: User
  access_token: string
  token_type: string
  expires_in: number
}

export interface AdminDashboardData {
  message: string
  stats: {
    total_users: number
    admins: number
    managers: number
    employees: number
  }
}

export interface ManagerDashboardData {
  message: string
  team: Pick<User, 'id' | 'name' | 'email' | 'role'>[]
}

export interface EmployeeDashboardData {
  message: string
  tasks: {
    id: number
    title: string
    assignee: string
    status: string
  }[]
}
