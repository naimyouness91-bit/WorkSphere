export type ContractStatus = 'pending' | 'signed' | 'expired'

export interface Policy {
  id: number
  code: string
  version: number
  title: string
  description: string | null
  original_filename: string
  mime_type: string
  file_size: number
  effective_date: string
  is_current: boolean
  created_at: string | null
  creator?: { id: number; name: string }
}

export interface Contract {
  id: number
  title: string
  description: string | null
  employee_id: number
  employee?: { id: number; name: string; email: string }
  original_filename: string
  mime_type: string
  status: ContractStatus
  expires_at: string | null
  signed_at: string | null
  has_signed_pdf: boolean
  signature?: { signed_at: string | null; ip_address: string | null }
  created_at: string | null
}

export interface ComplianceStats {
  policies_current: number
  contracts_pending: number
  contracts_signed: number
  contracts_expired: number
  expiring_soon: number
  compliance_percent: number
}

export interface ExpiringContract {
  id: number
  title: string
  expires_at: string
  employee?: string
}

export interface ComplianceOverview {
  stats: ComplianceStats
  can_manage: boolean
  policies: Policy[]
  contracts: Contract[]
  expiring_soon: ExpiringContract[]
}

export interface ComplianceReport {
  summary: {
    total_contracts: number
    signed: number
    pending: number
    expired: number
    current_policies: number
  }
  signed_contracts: Array<{
    id: number
    title: string
    employee: string | null
    signed_at: string | null
  }>
  unsigned_employees: Array<{
    id: number
    name: string
    email: string
    pending_contracts: number
  }>
  expiring_soon: ExpiringContract[]
}
