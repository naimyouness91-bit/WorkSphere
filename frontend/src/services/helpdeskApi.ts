import { api } from './api'
import type { HelpdeskStats, SupportCategory, TicketSuggestions } from '../types/helpdesk'
import type { Ticket, TicketFilters, TicketSubmitData } from '../types/ticket'

function filterParams(filters: TicketFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.status) params.status = filters.status
  if (filters.category) params.category = filters.category
  if (filters.priority) params.priority = filters.priority
  return params
}

export const helpdeskApi = {
  overview: () =>
    api.get<{ data: { stats: HelpdeskStats; categories: SupportCategory[] } }>('/helpdesk/overview'),

  getTickets: (filters: TicketFilters) =>
    api.get<{ data: Ticket[] }>('/helpdesk/tickets', { params: filterParams(filters) }),

  getTicket: (id: number) => api.get<{ data: Ticket }>(`/helpdesk/tickets/${id}`),

  createTicket: (payload: TicketSubmitData) =>
    api.post<{ message: string; data: Ticket }>('/helpdesk/tickets', payload),

  assignTicket: (id: number, assigned_to: number | null) =>
    api.patch<{ message: string; data: Ticket }>(`/helpdesk/tickets/${id}/assign`, { assigned_to }),

  updateStatus: (id: number, status: string, comment?: string) =>
    api.patch<{ message: string; data: Ticket }>(`/helpdesk/tickets/${id}/status`, { status, comment }),

  addComment: (id: number, message: string) =>
    api.post<{ message: string; data: Ticket }>(`/helpdesk/tickets/${id}/comments`, { message }),

  getSla: (ticketId?: number) =>
    api.get<{ data: Record<string, unknown> }>('/helpdesk/sla', {
      params: ticketId ? { ticket_id: ticketId } : undefined,
    }),

  getSuggestions: (ticketId: number) =>
    api.get<{ data: TicketSuggestions }>(`/helpdesk/tickets/${ticketId}/suggestions`),

  startChat: (ticketId: number, support_user_id?: number) =>
    api.post<{ message: string; data: Ticket }>(`/helpdesk/tickets/${ticketId}/chat`, {
      support_user_id,
    }),

  export: (filters: TicketFilters) =>
    api.get<{ data: Record<string, unknown>[] }>('/helpdesk/tickets/export', {
      params: filterParams(filters),
    }),
}
