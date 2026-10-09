import { api } from './api'
import type { GamificationStats } from '../types/gamification'
import type { ComplianceStats } from '../types/compliance'
import type { AssetStats } from '../types/asset'
import type { ProjectManagementStats } from '../types/projectManagement'
import type { KnowledgeStats } from '../types/knowledge'
import type { RecruitmentStats } from '../types/recruitment'
import type { CrmStats } from '../types/crm'
import type { HelpdeskStats } from '../types/helpdesk'
import type { InventoryStats } from '../types/inventory'
import type { FinanceStats } from '../types/accounting'
import type { SecurityStats } from '../types/security'
import type { IntegrationStats } from '../types/integration'
import type { AnalyticsStats } from '../types/analyticsInsight'

export interface OfflineStats {
  last_sync_at: string | null
  pending_changes: number | null
}

export interface CustomizationStats {
  active_workflows: number
  custom_themes_applied: number
}

export interface HomeKpis {
  total_employees: number | null
  pending_requests: number
  upcoming_trainings: number
  active_projects: number
  ai_suggestions_today?: number
  gamification_stats?: GamificationStats
  compliance_status?: ComplianceStats
  asset_stats?: AssetStats | null
  project_management?: ProjectManagementStats
  knowledge_base_stats?: KnowledgeStats
  recruitment_stats?: RecruitmentStats
  crm_stats?: CrmStats | null
  helpdesk_stats?: HelpdeskStats
  inventory_stats?: InventoryStats | null
  finance_stats?: FinanceStats | null
  security_stats?: SecurityStats | null
  integration_stats?: IntegrationStats | null
  analytics_stats?: AnalyticsStats | null
  offline_stats?: OfflineStats | null
  customization_stats?: CustomizationStats | null
}

export interface HomeActivityItem {
  type: 'request' | 'document' | 'evaluation'
  id: number
  title: string
  subtitle: string | null
  status: string | null
  occurred_at: string
}

export interface HomeOverview {
  kpis: HomeKpis
  recent_activity: HomeActivityItem[]
}

export const homeApi = {
  overview: () => api.get<{ data: HomeOverview }>('/home/overview'),
}
