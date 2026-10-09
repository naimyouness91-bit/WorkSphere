import type { TicketSla, TicketUpdate } from './helpdesk'

export type TicketCategory = 'it' | 'hr' | 'finance' | 'other'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high'

export interface TicketUser {
  id: number
  name: string
  email: string
}

export interface Ticket {
  id: number
  title: string
  description: string
  category: TicketCategory
  support_category_id?: number | null
  status: TicketStatus
  priority: TicketPriority
  employee_id: number
  assigned_to: number | null
  conversation_id?: number | null
  resolved_at: string | null
  first_response_at?: string | null
  escalated_at?: string | null
  sla_escalated?: boolean
  employee?: TicketUser
  assignee?: TicketUser | null
  sla?: TicketSla | null
  updates?: TicketUpdate[]
  support_category?: { id: number; name: string; slug: string; description?: string | null } | null
  conversation?: { id: number; name: string | null; type: string } | null
  created_at?: string
  updated_at?: string
}

export interface TicketFilters {
  status: string
  category: string
  priority: string
}

export interface TicketSubmitData {
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
}

export interface TicketUpdateData {
  status?: TicketStatus
  priority?: TicketPriority
  assigned_to?: number | null
}

export function emptyTicketFilters(): TicketFilters {
  return { status: '', category: '', priority: '' }
}

export function emptyTicketSubmit(): TicketSubmitData {
  return {
    title: '',
    description: '',
    category: 'it',
    priority: 'medium',
  }
}
