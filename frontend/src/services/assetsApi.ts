import { api } from './api'
import type { Asset, AssetHistory, AssetExportRow } from '../types/asset'

export const assetsApi = {
  list: (params?: { type?: string; status?: string; assigned_only?: boolean }) =>
    api.get<{ data: Asset[] }>('/assets', { params }),

  get: (id: number) => api.get<{ data: Asset }>(`/assets/${id}`),

  create: (payload: Record<string, unknown>) =>
    api.post<{ data: Asset; message: string }>('/assets', payload),

  history: (id: number) => api.get<{ data: AssetHistory }>(`/assets/${id}/history`),

  assign: (id: number, payload: Record<string, unknown>) =>
    api.post<{ data: { asset: Asset }; message: string }>(`/assets/${id}/assign`, payload),

  return: (id: number, returnDate?: string) =>
    api.post<{ data: Asset; message: string }>(`/assets/${id}/return`, { return_date: returnDate }),

  scheduleMaintenance: (id: number, payload: { description: string; scheduled_date: string }) =>
    api.post(`/assets/${id}/maintenance`, payload),

  completeMaintenance: (maintenanceId: number) =>
    api.post(`/assets/maintenance/${maintenanceId}/complete`),

  export: (params?: { type?: string; status?: string }) =>
    api.get<{ data: AssetExportRow[] }>('/assets/export', { params }),

  lookupQr: (token: string) =>
    api.get<{ data: { asset: Asset; history: AssetHistory } }>('/assets/lookup', {
      params: { token },
    }),

  qrSvg: (id: number) =>
    api.get(`/assets/${id}/qr`, {
      responseType: 'blob',
      headers: { Accept: 'image/svg+xml' },
    }),
}
