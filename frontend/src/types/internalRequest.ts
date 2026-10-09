export type RequestType = 'leave' | 'vehicle' | 'equipment'
export type RequestStatus = 'pending' | 'approved' | 'rejected'

export interface InternalRequest {
  id: number
  title: string
  description: string
  type: RequestType
  status: RequestStatus
  employee_id: number
  approver_id: number | null
  employee?: {
    id: number
    name: string
    email: string
  }
  approver?: {
    id: number
    name: string
  } | null
  created_at: string
  updated_at: string
}

export interface InternalRequestFormData {
  title: string
  description: string
  type: RequestType
}

export const REQUEST_TYPES: { value: RequestType; label: string }[] = [
  { value: 'leave', label: 'Leave' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'equipment', label: 'Equipment' },
]

export const emptyRequestForm = (): InternalRequestFormData => ({
  title: '',
  description: '',
  type: 'leave',
})
