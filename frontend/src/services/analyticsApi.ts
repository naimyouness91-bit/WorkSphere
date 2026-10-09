import { api } from './api'
import type { DashboardAnalyticsResponse } from '../types/analytics'

export const analyticsApi = {
  get: () => api.get<DashboardAnalyticsResponse>('/dashboard/analytics'),
}
