import { api } from './client'

export interface User {
  id: number
  name: string
  email: string
  role: string
  locale: string
}

export interface AuthResponse {
  message: string
  user: User
  access_token: string
  token_type: string
  expires_in: number
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  me: () => api.get<{ user: User }>('/auth/me'),

  logout: () => api.post('/auth/logout'),
}
