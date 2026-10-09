export type AssetType = 'equipment' | 'vehicle' | 'license'
export type AssetStatus = 'active' | 'inactive' | 'maintenance'

export interface AssetAssignmentSummary {
  id: number
  employee_id: number
  employee?: { id: number; name: string }
  assigned_date: string
  expected_return_date: string | null
}

export interface Asset {
  id: number
  name: string
  type: AssetType
  serial_number: string | null
  purchase_date: string | null
  status: AssetStatus
  qr_token: string
  notes: string | null
  is_assigned: boolean
  active_assignment?: AssetAssignmentSummary | null
  created_at: string | null
}

export interface AssetHistoryAssignment {
  id: number
  employee_id: number
  employee_name: string | null
  assigned_date: string
  return_date: string | null
  expected_return_date: string | null
  notes: string | null
  is_active: boolean
}

export interface AssetHistoryMaintenance {
  id: number
  description: string
  scheduled_date: string
  completed_date: string | null
  is_pending: boolean
}

export interface AssetHistory {
  assignments: AssetHistoryAssignment[]
  maintenances: AssetHistoryMaintenance[]
}

export interface AssetStats {
  total_assets: number
  in_maintenance: number
  assigned_assets: number
}

export interface AssetExportRow {
  id: number
  name: string
  type: string
  serial_number: string | null
  purchase_date: string | null
  status: string
  assigned_to: string | null | undefined
  assigned_date: string | null | undefined
}
