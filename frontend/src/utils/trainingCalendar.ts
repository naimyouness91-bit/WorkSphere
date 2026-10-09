import type { Training, TrainingStatus } from '../types/training'

const STATUS_COLORS: Record<TrainingStatus, { bg: string; border: string }> = {
  scheduled: { bg: '#6366f1', border: '#4f46e5' },
  completed: { bg: '#10b981', border: '#059669' },
}

export interface TrainingCalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  editable: boolean
  extendedProps: { training: Training }
}

export function mapTrainingsToCalendar(
  trainings: Training[],
  canEdit: boolean,
): TrainingCalendarEvent[] {
  return trainings.map((training) => {
    const colors = STATUS_COLORS[training.status] ?? STATUS_COLORS.scheduled
    const assigneeLabel =
      training.assignees && training.assignees.length > 0
        ? ` (${training.assignees.length})`
        : ''

    return {
      id: String(training.id),
      title: `${training.title}${assigneeLabel}`,
      start: training.start_date,
      end: training.end_date,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: '#ffffff',
      editable: canEdit && training.status === 'scheduled',
      extendedProps: { training },
    }
  })
}
