import { api } from './api'
import type {
  CrmClient,
  CrmDeal,
  CrmInteraction,
  CrmOverview,
  CrmPartner,
  DealStage,
  DealStatus,
  InteractionType,
} from '../types/crm'

export const crmApi = {
  overview: () => api.get<{ data: CrmOverview }>('/crm/overview'),

  clients: (params?: { status?: string; company?: string }) =>
    api.get<{ data: CrmClient[] }>('/crm/clients', { params }),

  addClient: (payload: {
    name: string
    company: string
    email?: string
    phone?: string
    status?: string
  }) => api.post<{ data: CrmClient; message: string }>('/crm/clients', payload),

  exportClients: (params?: { status?: string; company?: string }) =>
    api.get<{ data: Record<string, unknown>[] }>('/crm/clients/export', { params }),

  partners: (params?: { status?: string }) =>
    api.get<{ data: CrmPartner[] }>('/crm/partners', { params }),

  addPartner: (payload: {
    name: string
    organization: string
    contact_info?: string
    status?: string
  }) => api.post<{ data: CrmPartner; message: string }>('/crm/partners', payload),

  exportPartners: (params?: { status?: string }) =>
    api.get<{ data: Record<string, unknown>[] }>('/crm/partners/export', { params }),

  interactions: (params?: { client_id?: number; partner_id?: number; limit?: number }) =>
    api.get<{ data: CrmInteraction[] }>('/crm/interactions', { params }),

  logInteraction: (payload: {
    client_id?: number
    partner_id?: number
    type: InteractionType
    notes?: string
    occurred_at?: string
  }) => api.post<{ data: CrmInteraction; message: string }>('/crm/interactions', payload),

  deals: (params?: { stage?: string; client_id?: number }) =>
    api.get<{ data: CrmDeal[] }>('/crm/deals', { params }),

  addDeal: (payload: {
    client_id: number
    title: string
    value?: number
    stage?: DealStage
    expected_close_date?: string
  }) => api.post<{ data: CrmDeal; message: string }>('/crm/deals', payload),

  updateDealStatus: (id: number, payload: { stage?: DealStage; status?: DealStatus }) =>
    api.patch<{ data: CrmDeal; message: string }>(`/crm/deals/${id}/status`, payload),

  syncIntegrations: (payload: {
    source: 'email' | 'calendar'
    interactions: Array<{
      external_id?: string
      client_id?: number
      partner_id?: number
      type?: InteractionType
      notes?: string
      subject?: string
      occurred_at?: string
    }>
  }) => api.post<{ data: { created: number; skipped: number }; message: string }>(
    '/crm/integrations/sync',
    payload,
  ),
}
