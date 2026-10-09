import { api } from './api'
import type { AssistantChatResponse, AssistantSuggestResponse } from '../types/assistant'

export const assistantApi = {
  suggest: () => api.get<{ data: AssistantSuggestResponse }>('/assistant/suggest'),

  chat: (message: string) =>
    api.post<{ data: AssistantChatResponse }>('/assistant/chat', { message }),

  stats: () =>
    api.get<{ data: { ai_suggestions_today: number; ai_configured: boolean } }>('/assistant/stats'),

  history: (limit = 20) =>
    api.get<{ data: unknown[]; ai_suggestions_today: number }>('/assistant/history', {
      params: { limit },
    }),
}
