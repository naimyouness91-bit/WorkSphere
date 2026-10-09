import { api } from './api'
import type {
  AuditLog,
  AuditLogFilters,
  AuditSummary,
  PaginatedAuditLogs,
} from '../types/auditLog'

function filterParams(filters: AuditLogFilters, page: number): Record<string, string | number> {
  const params: Record<string, string | number> = { page }
  if (filters.user_id) params.user_id = filters.user_id
  if (filters.module) params.module = filters.module
  if (filters.action) params.action = filters.action
  if (filters.date_from) params.date_from = filters.date_from
  if (filters.date_to) params.date_to = filters.date_to
  if (filters.search) params.search = filters.search
  return params
}

export const auditLogsApi = {
  index: (filters: AuditLogFilters, page = 1) =>
    api.get<PaginatedAuditLogs>('/audit-logs', { params: filterParams(filters, page) }),

  show: (id: number) => api.get<{ data: AuditLog }>(`/audit-logs/${id}`),

  summary: () => api.get<{ data: AuditSummary }>('/audit-logs/summary'),
}
