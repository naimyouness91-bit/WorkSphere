export type ClientStatus = 'active' | 'inactive'
export type PartnerStatus = 'active' | 'inactive'
export type InteractionType = 'call' | 'meeting' | 'email'
export type DealStage = 'prospect' | 'negotiation' | 'closed'
export type DealStatus = 'open' | 'won' | 'lost'

export interface CrmClient {
  id: number
  name: string
  company: string
  email: string | null
  phone: string | null
  status: ClientStatus
  owner?: { id: number; name: string }
  deals_count?: number
}

export interface CrmPartner {
  id: number
  name: string
  organization: string
  contact_info: string | null
  status: PartnerStatus
  owner?: { id: number; name: string }
}

export interface CrmInteraction {
  id: number
  client_id: number | null
  partner_id: number | null
  type: InteractionType
  notes: string | null
  occurred_at: string
  source: string
  client?: { id: number; name: string; company: string }
  partner?: { id: number; name: string; organization: string }
  logger?: { id: number; name: string }
}

export interface CrmDeal {
  id: number
  client_id: number
  title: string
  value: number
  stage: DealStage
  status: DealStatus
  expected_close_date?: string | null
  client?: { id: number; name: string; company: string }
  owner?: { id: number; name: string }
}

export interface CrmStats {
  active_clients: number
  deals_in_pipeline: number
  closed_deals: number
  pipeline_value: number
}

export interface CrmOverview {
  stats: CrmStats
  companies: string[]
  deal_stages: string[]
}
