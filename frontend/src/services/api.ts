import axios from 'axios'
import i18n from '../i18n'
import type {
  AdminDashboardData,
  AuthResponse,
  EmployeeDashboardData,
  ManagerDashboardData,
  User,
} from '../types/auth'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const locale = i18n.language?.split('-')[0] ?? 'en'
  config.headers['X-Locale'] = locale
  config.headers['Accept-Language'] = locale
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
    }
    return Promise.reject(error)
  },
)

export interface HealthResponse {
  status: string
  service: string
  timestamp: string
}

export const healthApi = {
  check: () => api.get<HealthResponse>('/health'),
}

export const authApi = {
  register: (data: {
    name: string
    email: string
    password: string
    password_confirmation: string
    locale?: string
  }) => api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<{ user: User }>('/auth/me'),

  refresh: () =>
    api.post<{ access_token: string; token_type: string; expires_in: number }>(
      '/auth/refresh',
    ),

  updateLocale: (locale: string) =>
    api.patch<{ message: string; user: User }>('/auth/locale', { locale }),

  forgotPassword: (data: { email: string }) =>
    api.post<{ message: string }>('/auth/forgot-password', data),

  resetPassword: (data: {
    email: string
    token: string
    password: string
    password_confirmation: string
  }) => api.post<{ message: string }>('/auth/reset-password', data),
}

export const dashboardApi = {
  admin: () => api.get<AdminDashboardData>('/dashboard/admin'),
  manager: () => api.get<ManagerDashboardData>('/dashboard/manager'),
  employee: () => api.get<EmployeeDashboardData>('/dashboard/employee'),
}
