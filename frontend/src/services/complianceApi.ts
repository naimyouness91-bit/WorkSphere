import { api } from './api'
import type { ComplianceOverview, ComplianceReport, Contract, Policy } from '../types/compliance'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const complianceApi = {
  overview: () => api.get<{ data: ComplianceOverview }>('/compliance/overview'),

  report: () => api.get<{ data: ComplianceReport }>('/compliance/report'),

  policies: (currentOnly = true) =>
    api.get<{ data: Policy[] }>('/compliance/policies', {
      params: { current_only: currentOnly },
    }),

  uploadPolicy: (form: FormData) =>
    api.post<{ data: Policy; message: string }>('/compliance/policies', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  policyVersions: (policyId: number) =>
    api.get<{ data: Policy[] }>(`/compliance/policies/${policyId}/versions`),

  downloadPolicy: async (policyId: number, filename: string) => {
    const res = await api.get<Blob>(`/compliance/policies/${policyId}/download`, {
      responseType: 'blob',
    })
    downloadBlob(res.data, filename)
  },

  contracts: (params?: { employee_id?: number; status?: string }) =>
    api.get<{ data: Contract[] }>('/compliance/contracts', { params }),

  publishContract: (form: FormData) =>
    api.post<{ data: Contract; message: string }>('/compliance/contracts', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  signContract: (contractId: number, signatureData: string) =>
    api.post<{ data: Contract; message: string }>(`/compliance/contracts/${contractId}/sign`, {
      signature_data: signatureData,
    }),

  downloadContract: async (contractId: number, filename: string) => {
    const res = await api.get<Blob>(`/compliance/contracts/${contractId}/download`, {
      responseType: 'blob',
    })
    downloadBlob(res.data, filename)
  },
}
