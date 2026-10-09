export type ItemStatus = 'in_stock' | 'out_of_stock'
export type SupplierStatus = 'active' | 'inactive'
export type PurchaseOrderStatus = 'pending' | 'approved' | 'delivered'
export type StockMovementType = 'in' | 'out'

export interface InventoryStats {
  total_items: number
  active_suppliers: number
  pending_pos: number
  low_stock_items: number
}

export interface InventoryItem {
  id: number
  name: string
  category: string
  quantity: number
  unit_price: number
  status: ItemStatus
  sku: string | null
  qr_token: string
  reorder_level: number
  low_stock: boolean
  created_at?: string
}

export interface Supplier {
  id: number
  name: string
  contact_info: string | null
  rating: number
  status: SupplierStatus
  purchase_orders_count?: number
}

export interface PurchaseOrderLine {
  id: number
  inventory_item_id: number
  quantity: number
  unit_price: number
  line_total: number
  item?: { id: number; name: string; category: string } | null
}

export interface PurchaseOrder {
  id: number
  po_number: string
  supplier_id: number
  total_amount: number
  status: PurchaseOrderStatus
  notes: string | null
  supplier?: { id: number; name: string; rating: number }
  creator?: { id: number; name: string }
  approver?: { id: number; name: string } | null
  lines?: PurchaseOrderLine[]
  created_at?: string
}

export interface StockMovement {
  id: number
  inventory_item_id: number
  type: StockMovementType
  quantity: number
  moved_at: string
  notes: string | null
  item?: { id: number; name: string; category: string }
  user?: { id: number; name: string } | null
}

export interface PoLineInput {
  inventory_item_id: number
  quantity: number
  unit_price?: number
}
