export interface KnowledgeAuthor {
  id: number
  name: string
}

export interface KnowledgeArticle {
  id: number
  code: string
  version: number
  title: string
  content: string
  category: string
  is_current: boolean
  author?: KnowledgeAuthor
  helpful_count: number
  not_helpful_count: number
  user_rating?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface KnowledgeFaq {
  id: number
  question: string
  answer: string
  category: string
  sort_order: number
  created_at?: string
}

export interface KnowledgeDocument {
  id: number
  code: string
  version: number
  title: string
  description: string | null
  original_filename: string
  mime_type: string
  file_size: number
  is_current: boolean
  uploader?: KnowledgeAuthor
  created_at?: string
  updated_at?: string
}

export interface KnowledgeStats {
  recent_updates: number
  articles_count: number
  faqs_count: number
  documents_count: number
  new_articles_30d: number
  new_documents_30d: number
}

export interface KnowledgeOverview {
  stats: KnowledgeStats
  categories: string[]
  can_manage: boolean
  suggested_articles: KnowledgeArticle[]
}

export interface KnowledgeSearchResults {
  articles: KnowledgeArticle[]
  faqs: KnowledgeFaq[]
  documents: KnowledgeDocument[]
}
