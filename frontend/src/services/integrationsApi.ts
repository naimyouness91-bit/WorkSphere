import { api } from './api'
import type {
  Integration,
  IntegrationFormData,
  IntegrationKpis,
  IntegrationLog,
  IntegrationUpdateData,
  WebhookLog,
} from '../types/integration'

export const integrationsApi = {
  index: () => api.get<{ data: Integration[] }>('/integrations'),

  connect: (payload: IntegrationFormData) =>
    api.post<{ message: string; data: Integration }>('/integrations/connect', payload),

  store: (payload: IntegrationFormData) =>
    api.post<{ message: string; data: Integration }>('/integrations', payload),

  update: (id: number, payload: IntegrationUpdateData) =>
    api.put<{ message: string; data: Integration }>(`/integrations/${id}`, payload),

  destroy: (id: number) => api.delete<{ message: string }>(`/integrations/${id}`),

  test: (id: number, testEmail?: string) =>
    api.post<{ message: string; data: Integration }>(`/integrations/${id}/test`, {
      test_email: testEmail,
    }),

  sendMessage: (payload: { service: 'slack' | 'teams'; message: string; title?: string }) =>
    api.post<{ message: string }>('/integrations/message', payload),

  sendEmail: (payload: { to: string; subject: string; body: string }) =>
    api.post<{ message: string }>('/integrations/email', payload),

  logs: (integrationId?: number) =>
    api.get<{ data: IntegrationLog[] }>('/integrations/logs', {
      params: integrationId ? { integration_id: integrationId } : {},
    }),

  webhookLogs: (params?: { service_name?: string; event_type?: string; page?: number }) =>
    api.get<{ data: WebhookLog[]; meta?: { current_page: number; last_page: number; total: number } }>(
      '/integrations/webhook-logs',
      { params },
    ),

  summary: () => api.get<{ data: { kpis: IntegrationKpis } }>('/integrations/summary'),

  export: () =>
    api.get<{ data: unknown[]; exported_at: string }>('/integrations/export'),

  exportLogs: (type: 'activity' | 'webhook' = 'activity') =>
    api.get<{ data: Record<string, unknown>[]; exported_at: string }>('/integrations/logs/export', {
      params: { type },
    }),

  syncCalendars: () =>
    api.post<{ message: string; data: { synced: number } }>('/integrations/sync-calendars'),
}
