export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met'

export interface TicketSla {
  status: SlaStatus
  response_due_at: string
  resolution_due_at: string
  responded_at: string | null
  resolved_at: string | null
  response_seconds_remaining: number
  resolution_seconds_remaining: number
}

export interface TicketUpdate {
  id: number
  type: 'created' | 'comment' | 'status_change' | 'assignment' | 'escalation'
  message: string
  meta?: Record<string, unknown> | null
  user: { id: number; name: string } | null
  created_at: string
}

export interface HelpdeskStats {
  open_tickets: number
  sla_breaches: number
  resolved_tickets: number
  at_risk: number
}

export interface KnowledgeSuggestionArticle {
  id: number
  title: string
  category: string
  excerpt: string
  helpful_count: number
}

export interface KnowledgeSuggestionFaq {
  id: number
  question: string
  answer: string
  category: string
}

export interface TicketSuggestions {
  articles: KnowledgeSuggestionArticle[]
  faqs: KnowledgeSuggestionFaq[]
}

export interface SupportCategory {
  id: number
  name: string
  slug: string
  description: string | null
}
