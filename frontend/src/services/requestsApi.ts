import { api } from './api'
import type {
  InternalRequest,
  InternalRequestFormData,
} from '../types/internalRequest'

interface RequestResponse {
  message?: string
  data: InternalRequest
}

interface RequestsListResponse {
  data: InternalRequest[]
}

export const requestsApi = {
  index: () => api.get<RequestsListResponse>('/requests'),

  show: (id: number) => api.get<RequestResponse>(`/requests/${id}`),

  store: (payload: InternalRequestFormData) =>
    api.post<RequestResponse>('/requests', payload),

  update: (id: number, status: 'approved' | 'rejected') =>
    api.put<RequestResponse>(`/requests/${id}`, { status }),
}
