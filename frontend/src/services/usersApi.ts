import { api } from './api'
import type { AppUser } from '../types/userList'

export const usersApi = {
  index: () => api.get<{ data: AppUser[] }>('/users'),
}
