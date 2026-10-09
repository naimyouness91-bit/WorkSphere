export type SuggestionCategory = 'request' | 'training' | 'payroll' | 'analytics'

export interface AssistantSuggestion {
  id: string
  category: SuggestionCategory
  title: string
  description: string
  action_type: string
  action_path: string
  priority: 'high' | 'medium' | 'low'
}

export interface AssistantSuggestResponse {
  greeting: string
  suggestions: AssistantSuggestion[]
  ai_suggestions_today: number
  summary?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantChatResponse {
  greeting: string
  reply: string
  history: ChatMessage[]
  ai_suggestions_today: number
}
