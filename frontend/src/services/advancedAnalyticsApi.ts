import { api } from './api'
import type { AnalyticsInsight, AnalyticsOverview } from '../types/analyticsInsight'
import type { ReportFilters, ReportFormData, SavedReport } from '../types/report'

function filterParams(filters: ReportFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.module) params.module = filters.module
  if (filters.department) params.department = filters.department
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to
  return params
}

export const advancedAnalyticsApi = {
  overview: (filters: ReportFilters) =>
    api.get<{ data: AnalyticsOverview; departments: string[] }>('/analytics/overview', {
      params: filterParams(filters),
    }),

  insights: (category?: string) =>
    api.get<{ data: AnalyticsInsight[] }>('/analytics/insights', {
      params: category ? { category } : {},
    }),

  refreshInsights: () =>
    api.post<{ message: string; data: { created: number } }>('/analytics/insights/refresh'),

  reports: (params?: { type?: string; date_from?: string; date_to?: string; page?: number }) =>
    api.get('/analytics/reports', { params }),

  generateReport: (payload: ReportFormData) =>
    api.post<{ message: string; data: SavedReport }>('/analytics/reports/generate', payload),
}
