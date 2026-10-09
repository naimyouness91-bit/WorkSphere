import { api } from './client'

export interface MobileKpis {
  requests: number
  training: number
  payroll: number | null
  analytics: number
}

export interface MobileDashboard {
  kpis: MobileKpis
  full_kpis: Record<string, number | null>
  recent_activity: Array<{
    type: string
    id: number
    title: string
    subtitle: string | null
    status: string | null
    occurred_at: string
  }>
}

export interface AppNotification {
  id: number
  title: string | null
  message: string
  type: string
  category: string
  read_status: boolean
  created_at: string
}

export interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  category_push: string[]
  category_email: string[]
  available_categories: string[]
}

export const mobileApi = {
  dashboard: () => api.get<{ data: MobileDashboard }>('/mobile/dashboard'),

  notifications: () =>
    api.get<{ data: AppNotification[]; unread_count: number }>('/mobile/notifications'),

  markRead: (id: number) => api.patch(`/notifications/${id}/read`),

  markAllRead: () => api.patch('/notifications/read-all'),

  registerDevice: (token: string, platform: 'ios' | 'android') =>
    api.post('/mobile/device-tokens', { token, platform }),

  preferences: () => api.get<{ data: NotificationPreferences }>('/mobile/notification-preferences'),

  updatePreferences: (data: Partial<NotificationPreferences>) =>
    api.patch<{ data: NotificationPreferences }>('/mobile/notification-preferences', data),

  submitRequest: (payload: { title: string; type: string; description: string }) =>
    api.post('/mobile/requests', payload),

  sync: (actions: Array<{ type: string; payload: Record<string, unknown>; client_id?: string }>) =>
    api.post('/mobile/sync', { actions }),
}
