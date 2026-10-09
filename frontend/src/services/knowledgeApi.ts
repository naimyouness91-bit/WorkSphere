import { api } from './api'
import type {
  KnowledgeArticle,
  KnowledgeDocument,
  KnowledgeFaq,
  KnowledgeOverview,
  KnowledgeSearchResults,
} from '../types/knowledge'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const knowledgeApi = {
  overview: () => api.get<{ data: KnowledgeOverview }>('/knowledge/overview'),

  articles: (category?: string) =>
    api.get<{ data: KnowledgeArticle[] }>('/knowledge/articles', {
      params: category ? { category } : undefined,
    }),

  article: (id: number) => api.get<{ data: KnowledgeArticle }>(`/knowledge/articles/${id}`),

  addArticle: (payload: { title: string; content: string; category?: string; code?: string }) =>
    api.post<{ data: KnowledgeArticle; message: string }>('/knowledge/articles', payload),

  articleVersions: (id: number) =>
    api.get<{ data: KnowledgeArticle[] }>(`/knowledge/articles/${id}/versions`),

  rateArticle: (id: number, helpful: boolean) =>
    api.post<{ data: { helpful_count: number; not_helpful_count: number; user_rating: boolean }; message: string }>(
      `/knowledge/articles/${id}/rate`,
      { helpful },
    ),

  faqs: (category?: string) =>
    api.get<{ data: KnowledgeFaq[] }>('/knowledge/faqs', {
      params: category ? { category } : undefined,
    }),

  documents: () => api.get<{ data: KnowledgeDocument[] }>('/knowledge/documents'),

  uploadDocument: (form: FormData) =>
    api.post<{ data: KnowledgeDocument; message: string }>('/knowledge/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  documentVersions: (id: number) =>
    api.get<{ data: KnowledgeDocument[] }>(`/knowledge/documents/${id}/versions`),

  downloadDocument: async (id: number, filename: string) => {
    const res = await api.get<Blob>(`/knowledge/documents/${id}/download`, {
      responseType: 'blob',
    })
    downloadBlob(res.data, filename)
  },

  previewDocumentUrl: (id: number) => {
    const base = import.meta.env.VITE_API_URL ?? '/api'
    const token = localStorage.getItem('access_token')
    const q = token ? `?token=${encodeURIComponent(token)}` : ''
    return `${base}/knowledge/documents/${id}/preview${q}`
  },

  search: (q: string, category?: string, type?: 'article' | 'faq' | 'document') =>
    api.get<{ data: KnowledgeSearchResults }>('/knowledge/search', {
      params: { q, category, type },
    }),
}
