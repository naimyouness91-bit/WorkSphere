import { api } from './api'
import type { OfflineBundle } from '../offline/db'

export interface SyncActionResult {
  client_id?: string
  type?: string
  status: 'ok' | 'failed' | 'conflict'
  error?: string
  server?: Record<string, unknown>
  resolution?: string
}

export interface SyncOfflineResponse {
  results: SyncActionResult[]
  summary: {
    applied: number
    failed: number
    conflicts: number
  }
}

export interface SyncLogEntry {
  id: number
  action: string
  status: string
  description: string | null
  client_id: string | null
  occurred_at: string
}

export const mobileOfflineApi = {
  getOfflineData: () => api.get<{ data: OfflineBundle; message: string }>('/mobile/offline-data'),

  syncOfflineChanges: (body: {
    actions: Array<{
      type: string
      payload: Record<string, unknown>
      client_id?: string
    }>
  }) => api.post<{ data: SyncOfflineResponse; message: string }>('/mobile/sync-offline', body),

  syncLogs: () => api.get<{ data: { logs: SyncLogEntry[] } }>('/mobile/sync-logs'),
}
