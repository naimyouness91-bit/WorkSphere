export type ConversationType = 'direct' | 'group'
export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface ChatUser {
  id: number
  name: string
  email: string
}

export interface MessageAttachment {
  url: string
  name: string
  mime: string
  size: number
}

export interface ChatMessage {
  id: number
  conversation_id: number
  sender_id: number
  receiver_id: number | null
  content: string | null
  status: MessageStatus
  attachment: MessageAttachment | null
  sender?: ChatUser
  read_by_user_ids?: number[]
  created_at: string
  updated_at?: string
}

export interface Conversation {
  id: number
  type: ConversationType
  name: string | null
  created_by: number
  participants?: ChatUser[]
  last_message?: ChatMessage | null
  unread_count: number
  updated_at?: string
}

export interface CreateConversationPayload {
  type: ConversationType
  name?: string
  participant_ids: number[]
}
