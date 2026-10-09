import { api } from './api'
import type {
  DrillDownItem,
  ReportFilters,
  ReportFormData,
  ReportStatistics,
  SavedReport,
  ScheduleFrequency,
} from '../types/report'

function filterParams(filters: ReportFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.module) params.module = filters.module
  if (filters.department) params.department = filters.department
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to
  return params
}

export const reportsApi = {
  statistics: (filters: ReportFilters) =>
    api.get<{ data: ReportStatistics; departments: string[] }>('/reports/statistics', {
      params: filterParams(filters),
    }),

  drillDown: (
    module: string,
    segment: string,
    filters: ReportFilters,
  ) =>
    api.get<{ data: { items: DrillDownItem[] } }>('/reports/statistics/drill-down', {
      params: { module, segment, ...filterParams(filters) },
    }),

  index: (type?: string, page = 1) =>
    api.get<{ data: SavedReport[]; meta: { current_page: number; last_page: number; total: number } }>(
      '/reports',
      { params: { type, page } },
    ),

  show: (id: number) => api.get<{ data: SavedReport }>(`/reports/${id}`),

  store: (payload: ReportFormData) =>
    api.post<{ message: string; data: SavedReport }>('/reports', payload),

  updateSchedule: (
    id: number,
    payload: { is_scheduled: boolean; schedule_frequency?: ScheduleFrequency | null },
  ) => api.patch<{ message: string; data: SavedReport }>(`/reports/${id}/schedule`, payload),
}
