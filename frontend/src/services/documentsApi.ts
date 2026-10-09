import { api } from './api'
import type { Document } from '../types/document'

interface DocumentResponse {
  message: string
  data: Document
}

interface DocumentsListResponse {
  data: Document[]
}

export const documentsApi = {
  index: () => api.get<DocumentsListResponse>('/documents'),

  store: (formData: FormData) =>
    api.post<DocumentResponse>('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  destroy: (id: number) => api.delete<{ message: string }>(`/documents/${id}`),

  download: (id: number) =>
    api.get<Blob>(`/documents/${id}/download`, { responseType: 'blob' }),

  preview: (id: number) =>
    api.get<Blob>(`/documents/${id}/preview`, { responseType: 'blob' }),
}
