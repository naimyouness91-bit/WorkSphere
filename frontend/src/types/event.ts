export type EventType = 'leave' | 'meeting' | 'vehicle'
export type EventStatus = 'scheduled' | 'canceled'

export interface CalendarEventOwner {
  id: number
  name: string
  email: string
}

export interface CalendarEvent {
  id: number
  title: string
  description: string | null
  type: EventType
  status: EventStatus
  start_date: string
  end_date: string
  employee_id: number
  employee?: CalendarEventOwner
  created_at: string
  updated_at: string
}

export interface EventFormData {
  title: string
  description: string
  type: EventType
  status: EventStatus
  start_date: string
  end_date: string
}

export interface EventFilters {
  employee_id: string
  type: string
  status: string
  date_from: string
  date_to: string
}

export const EVENT_TYPES: EventType[] = ['leave', 'meeting', 'vehicle']

export const emptyEventFilters = (): EventFilters => ({
  employee_id: '',
  type: '',
  status: '',
  date_from: '',
  date_to: '',
})

export function emptyEventForm(): EventFormData {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)

  return {
    title: '',
    description: '',
    type: 'meeting',
    status: 'scheduled',
    start_date: toLocalInputValue(start),
    end_date: toLocalInputValue(end),
  }
}

export function eventToForm(event: CalendarEvent): EventFormData {
  return {
    title: event.title,
    description: event.description ?? '',
    type: event.type,
    status: event.status,
    start_date: toLocalInputValue(new Date(event.start_date)),
    end_date: toLocalInputValue(new Date(event.end_date)),
  }
}

export function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toIsoFromLocalInput(value: string): string {
  return new Date(value).toISOString()
}
