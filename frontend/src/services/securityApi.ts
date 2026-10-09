import { api } from './api'
import type { AuditLogFilters } from '../types/auditLog'
import type {
  PaginatedSecurityAlerts,
  RolePermissionRow,
  SecurityOverview,
} from '../types/security'

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

export const securityApi = {
  overview: () => api.get<{ data: SecurityOverview }>('/security/overview'),

  auditLogs: (filters: AuditLogFilters, page = 1) =>
    api.get('/security/audit-logs', { params: filterParams(filters, page) }),

  alerts: (params?: { severity?: string; status?: string; page?: number }) =>
    api.get<PaginatedSecurityAlerts>('/security/alerts', { params }),

  resolveAlert: (id: number) =>
    api.patch<{ message: string; data: unknown }>(`/security/alerts/${id}/resolve`),

  permissions: () => api.get<{ data: RolePermissionRow[] }>('/security/permissions'),

  addPermission: (payload: { role: string; permission: string; module: string }) =>
    api.post<{ message: string; data: RolePermissionRow }>('/security/permissions', payload),

  removePermission: (id: number) => api.delete<{ message: string }>(`/security/permissions/${id}`),

  export: (filters: AuditLogFilters) =>
    api.get<{ data: Record<string, unknown>[] }>('/security/export', {
      params: filterParams(filters, 1),
    }),
}
