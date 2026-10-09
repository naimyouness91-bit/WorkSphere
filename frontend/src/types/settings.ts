export type ThemeMode = 'light' | 'dark' | 'custom'

export type WorkflowDomain = 'general' | 'hr' | 'finance' | 'procurement' | 'it'

export type UserRole = 'admin' | 'manager' | 'employee'

export interface ThemeSettings {
  theme: ThemeMode
  primary_color: string
  secondary_color: string
  updated_at?: string
}

export interface WorkflowStep {
  order: number
  name: string
  approver_role?: UserRole
  description?: string | null
}

export interface Workflow {
  id: number
  title: string
  description: string | null
  steps: WorkflowStep[]
  assigned_roles: UserRole[]
  domain: WorkflowDomain
  is_active: boolean
  approval_chain?: WorkflowStep[]
  created_at?: string
  updated_at?: string
}

export interface SystemSettingItem {
  id: number
  key: string
  value: string
}

export interface SystemSettingGroup {
  category: string
  items: SystemSettingItem[]
}

export interface CustomizationStats {
  active_workflows: number
  custom_themes_applied: number
}

export interface CustomizationAuditEntry {
  id: number
  action: string
  entity_type: string
  entity_id: number | null
  changes: Record<string, unknown> | null
  logged_at: string
  user_id: number | null
}
