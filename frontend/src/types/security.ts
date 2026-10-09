export type AlertSeverity = 'low' | 'medium' | 'high'
export type AlertStatus = 'open' | 'resolved'

export interface SecurityStats {
  active_alerts: number
  failed_logins_24h: number
  unauthorized_attempts_24h: number
}

export interface RolePermissionRow {
  id: number
  role: string
  permission: string
  module: string
}

export interface PersistentSecurityAlert {
  id: number
  title: string
  description: string
  severity: AlertSeverity
  status: AlertStatus
  source_type: string | null
  meta: Record<string, unknown> | null
  resolved_at: string | null
  resolved_by?: { id: number; name: string } | null
  created_at: string
}

export interface SecurityOverview {
  kpis: {
    actions_logged_today: number
    most_active_users: { user_id: number; name: string | null; email: string | null; action_count: number }[]
    top_modules: { module: string; change_count: number }[]
  }
  security_kpis: SecurityStats
  alerts_by_severity: { severity: AlertSeverity; count: number }[]
  actions_by_module: { module: string; count: number }[]
  integrity: { valid: boolean; checked: number; broken_at_id: number | null }
}

export interface PaginatedSecurityAlerts {
  data: PersistentSecurityAlert[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
