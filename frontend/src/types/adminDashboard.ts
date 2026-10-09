import type { DeploymentRecord } from '../services/devopsApi'
import type { DashboardAnalytics } from './analytics'
import type { InternalRequest } from './internalRequest'

export interface ExtendedKpis {
  avg_approval_time_hours: number
  rejection_rate: number
  active_managers: number
  total_managers: number
}

export interface UserEngagementPoint {
  date: string
  admin: number
  manager: number
  employee: number
}

export interface AdminAnalytics extends DashboardAnalytics {
  extended_kpis: ExtendedKpis
  user_engagement: UserEngagementPoint[]
}

export interface ActivityLogEntry {
  id: number
  action: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
  user?: {
    id: number
    name: string
    email: string
    role: string
  }
}

export interface DevOpsMetrics {
  build_success_rate: number
  deployment_frequency: number
  error_rate: number
  total_deployments_30d: number
  active_staging_version: string | null
  active_production_version: string | null
}

export interface AdminOverview {
  analytics: AdminAnalytics
  activity: ActivityLogEntry[]
  devops?: {
    metrics: DevOpsMetrics
    recent_deployments: DeploymentRecord[]
  }
}

export interface RequestFilters {
  search: string
  status: string
  type: string
  date_from: string
  date_to: string
}

export const emptyRequestFilters = (): RequestFilters => ({
  search: '',
  status: '',
  type: '',
  date_from: '',
  date_to: '',
})

export type { InternalRequest as AdminRequestRow }
