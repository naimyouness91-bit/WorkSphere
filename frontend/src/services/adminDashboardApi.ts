import { api } from './api'
import type { AdminOverview, RequestFilters } from '../types/adminDashboard'
import type { InternalRequest } from '../types/internalRequest'

export const adminDashboardApi = {
  overview: (engagementPeriod: 'day' | 'week' = 'week') =>
    api.get<{ data: AdminOverview }>('/dashboard/admin/overview', {
      params: { engagement_period: engagementPeriod },
    }),

  requests: (filters: Partial<RequestFilters>) =>
    api.get<{ data: InternalRequest[] }>('/dashboard/admin/requests', {
      params: filters,
    }),
}
