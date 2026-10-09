export type NotificationType = 'info' | 'success' | 'error'
export type NotificationCategory = 'request' | 'payroll' | 'training' | 'system'

export interface AppNotification {
  id: number
  title?: string | null
  message: string
  type: NotificationType
  category?: NotificationCategory
  user_id: number
  read_status: boolean
  created_at: string
  updated_at?: string
}

export interface ToastNotification {
  id: string
  type: NotificationType
  message: string
}
