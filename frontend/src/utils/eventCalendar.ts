import type { CalendarEvent, EventStatus, EventType } from '../types/event'

const TYPE_COLORS: Record<EventType, { bg: string; border: string }> = {
  leave: { bg: '#10b981', border: '#059669' },
  meeting: { bg: '#6366f1', border: '#4f46e5' },
  vehicle: { bg: '#f59e0b', border: '#d97706' },
}

const CANCELED_STYLE = { bg: '#94a3b8', border: '#64748b' }

export interface FullCalendarEventInput {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  editable: boolean
  extendedProps: { event: CalendarEvent }
}

export function mapToFullCalendarEvents(
  events: CalendarEvent[],
  canEdit: (event: CalendarEvent) => boolean,
): FullCalendarEventInput[] {
  return events.map((event) => {
    const colors =
      event.status === 'canceled'
        ? CANCELED_STYLE
        : TYPE_COLORS[event.type] ?? TYPE_COLORS.meeting

    return {
      id: String(event.id),
      title: event.title,
      start: event.start_date,
      end: event.end_date,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: '#ffffff',
      editable: event.status === 'scheduled' && canEdit(event),
      extendedProps: { event },
    }
  })
}

export function getEventLegend(): { type: EventType | 'canceled'; color: string }[] {
  return [
    { type: 'leave', color: TYPE_COLORS.leave.bg },
    { type: 'meeting', color: TYPE_COLORS.meeting.bg },
    { type: 'vehicle', color: TYPE_COLORS.vehicle.bg },
    { type: 'canceled', color: CANCELED_STYLE.bg },
  ]
}

export function statusLabel(status: EventStatus): EventStatus {
  return status
}
