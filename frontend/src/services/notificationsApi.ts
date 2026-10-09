import { api } from './api'
import type { AppNotification } from '../types/notification'

interface NotificationsResponse {
  data: AppNotification[]
  unread_count: number
}

export const notificationsApi = {
  index: () => api.get<NotificationsResponse>('/notifications'),

  markAsRead: (id: number) =>
    api.patch<{ message: string; data: AppNotification }>(
      `/notifications/${id}/read`,
    ),

  markAllAsRead: () => api.patch<{ message: string }>('/notifications/read-all'),
}
