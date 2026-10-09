import { api } from './api'
import type { Ticket, TicketFilters, TicketSubmitData, TicketUpdateData } from '../types/ticket'

function filterParams(filters: TicketFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.status) params.status = filters.status
  if (filters.category) params.category = filters.category
  if (filters.priority) params.priority = filters.priority
  return params
}

export const ticketsApi = {
  index: (filters: TicketFilters) =>
    api.get<{ data: Ticket[] }>('/tickets', { params: filterParams(filters) }),

  show: (id: number) => api.get<{ data: Ticket }>(`/tickets/${id}`),

  store: (payload: TicketSubmitData) =>
    api.post<{ message: string; data: Ticket }>('/tickets', payload),

  update: (id: number, payload: TicketUpdateData) =>
    api.put<{ message: string; data: Ticket }>(`/tickets/${id}`, payload),
}
