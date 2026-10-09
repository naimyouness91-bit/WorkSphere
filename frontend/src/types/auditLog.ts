export type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete'
  | string

export interface AuditLogUser {
  id: number
  name: string
  email: string
  role: string
}

export interface AuditLog {
  id: number
  user_id: number | null
  action: AuditAction
  module: string
  description: string
  ip_address: string | null
  timestamp: string
  user?: AuditLogUser | null
  created_at?: string
}

export interface AuditLogFilters {
  user_id: string
  module: string
  action: string
  date_from: string
  date_to: string
  search: string
}

export function emptyAuditLogFilters(): AuditLogFilters {
  return {
    user_id: '',
    module: '',
    action: '',
    date_from: '',
    date_to: '',
    search: '',
  }
}

export interface SecurityAlert {
  type: string
  severity: 'high' | 'medium' | 'low'
  message: string
  ip_address?: string
  email?: string
  user_id?: number
  count?: number
}

export interface AuditKpis {
  actions_logged_today: number
  most_active_users: {
    user_id: number
    name: string | null
    email: string | null
    action_count: number
  }[]
  top_modules: {
    module: string
    change_count: number
  }[]
}

export interface AuditSummary {
  kpis: AuditKpis
  alerts: SecurityAlert[]
}

export interface PaginatedAuditLogs {
  data: AuditLog[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
