import { api } from './api'
import type { CalendarEvent, EventFilters } from '../types/event'

interface EventResponse {
  message: string
  data: CalendarEvent
}

interface EventsListResponse {
  data: CalendarEvent[]
}

export const eventsApi = {
  index: (filters?: Partial<EventFilters>) =>
    api.get<EventsListResponse>('/events', { params: filters }),

  show: (id: number) => api.get<{ data: CalendarEvent }>(`/events/${id}`),

  store: (payload: Record<string, unknown>) =>
    api.post<EventResponse>('/events', payload),

  update: (id: number, payload: Record<string, unknown>) =>
    api.put<EventResponse>(`/events/${id}`, payload),
}
