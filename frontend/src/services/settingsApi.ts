import { api } from './api'
import type {
  CustomizationAuditEntry,
  SystemSettingGroup,
  ThemeSettings,
  Workflow,
  WorkflowDomain,
} from '../types/settings'

export const settingsApi = {
  stats: () =>
    api.get<{ data: { active_workflows: number; custom_themes_applied: number } }>('/settings/stats'),

  getThemeSettings: () => api.get<{ data: ThemeSettings }>('/settings/theme'),

  updateThemeSettings: (body: Partial<ThemeSettings>) =>
    api.put<{ data: ThemeSettings; message: string }>('/settings/theme', body),

  getWorkflows: () => api.get<{ data: { workflows: Workflow[] } }>('/settings/workflows'),

  addWorkflow: (body: Omit<Workflow, 'id' | 'approval_chain' | 'created_at' | 'updated_at'>) =>
    api.post<{ data: Workflow; message: string }>('/settings/workflows', body),

  updateWorkflow: (id: number, body: Partial<Workflow>) =>
    api.put<{ data: Workflow; message: string }>(`/settings/workflows/${id}`, body),

  exportWorkflows: () =>
    api.get<{ data: { exported_at: string; workflows: Workflow[] } }>('/settings/workflows/export'),

  approvalChain: (domain: WorkflowDomain) =>
    api.get<{ data: { domain: string; chain: Workflow['steps'] } }>(
      '/settings/workflows/approval-chain',
      { params: { domain } },
    ),

  getSystemSettings: () => api.get<{ data: { groups: SystemSettingGroup[] } }>('/settings/system'),

  updateSystemSetting: (key: string, value: string) =>
    api.patch<{ data: SystemSettingItem; message: string }>('/settings/system', { key, value }),

  customizationHistory: () =>
    api.get<{ data: { logs: CustomizationAuditEntry[] } }>('/settings/history'),
}

interface SystemSettingItem {
  id: number
  key: string
  value: string
  category: string
}
