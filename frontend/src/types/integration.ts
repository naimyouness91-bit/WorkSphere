export type IntegrationServiceName = 'slack' | 'teams' | 'email' | 'google_drive' | 'dropbox' | 'google_calendar'
export type IntegrationStatus = 'active' | 'inactive'

export interface Integration {
  id: number
  service_name: IntegrationServiceName
  webhook_url: string | null
  status: IntegrationStatus
  settings: Record<string, string | number | boolean | null>
  has_api_key: boolean
  api_key_masked: string | null
  is_connected: boolean
  last_sync_at: string | null
  created_at?: string
  updated_at?: string
}

export interface IntegrationLog {
  id: number
  integration_id: number
  service_name?: string
  action: string
  message: string
  status: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface IntegrationKpis {
  active_integrations: number
  total_integrations: number
  messages_sent: number
  failed_logs: number
  webhook_events?: number
  last_sync_at: string | null
}

export interface IntegrationStats {
  active_integrations: number
  messages_sent: number
  failed_logs: number
}

export interface WebhookLog {
  id: number
  service_name: string
  event_type: string
  payload: Record<string, unknown> | null
  timestamp: string
  created_at: string
}

export interface IntegrationFormData {
  service_name: IntegrationServiceName
  api_key?: string
  webhook_url?: string
  status?: IntegrationStatus
  settings?: Record<string, string>
}

export interface IntegrationUpdateData {
  api_key?: string
  webhook_url?: string
  status?: IntegrationStatus
  settings?: Record<string, string>
}

export const AVAILABLE_INTEGRATIONS: IntegrationServiceName[] = [
  'slack',
  'teams',
  'email',
  'google_calendar',
  'google_drive',
  'dropbox',
]
