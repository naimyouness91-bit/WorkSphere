import { api } from './api'
import type { ChatMessage, Conversation, CreateConversationPayload } from '../types/chat'

export const chatApi = {
  listConversations: () => api.get<{ data: Conversation[] }>('/conversations'),

  createConversation: (payload: CreateConversationPayload) =>
    api.post<{ message: string; data: Conversation }>('/conversations', payload),

  getConversation: (id: number) => api.get<{ data: Conversation }>(`/conversations/${id}`),

  listMessages: (conversationId: number) =>
    api.get<{ data: ChatMessage[] }>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: number, formData: FormData) =>
    api.post<{ message: string; data: ChatMessage }>(
      `/conversations/${conversationId}/messages`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),

  markMessageRead: (messageId: number) =>
    api.patch<{ message: string; data: ChatMessage }>(`/messages/${messageId}/read`),

  sendTyping: (conversationId: number, isTyping: boolean) =>
    api.post(`/conversations/${conversationId}/typing`, { is_typing: isTyping }),
}
