import { api } from './api'
import type {
  InventoryItem,
  InventoryStats,
  PoLineInput,
  PurchaseOrder,
  StockMovement,
  Supplier,
} from '../types/inventory'

export const inventoryApi = {
  overview: () =>
    api.get<{ data: { stats: InventoryStats; categories: string[]; po_pipeline: string[] } }>(
      '/inventory/overview',
    ),

  getItems: (params?: { category?: string; status?: string; low_stock?: boolean }) =>
    api.get<{ data: InventoryItem[] }>('/inventory/items', { params }),

  getItem: (id: number) => api.get<{ data: InventoryItem }>(`/inventory/items/${id}`),

  addItem: (payload: {
    name: string
    category: string
    quantity?: number
    unit_price?: number
    sku?: string
    reorder_level?: number
  }) => api.post<{ data: InventoryItem; message: string }>('/inventory/items', payload),

  getSuppliers: (params?: { status?: string }) =>
    api.get<{ data: Supplier[] }>('/inventory/suppliers', { params }),

  getPurchaseOrders: (params?: { status?: string }) =>
    api.get<{ data: PurchaseOrder[] }>('/inventory/purchase-orders', { params }),

  createPurchaseOrder: (payload: {
    supplier_id: number
    notes?: string
    items: PoLineInput[]
  }) => api.post<{ data: PurchaseOrder; message: string }>('/inventory/purchase-orders', payload),

  updatePurchaseOrderStatus: (id: number, status: string) =>
    api.patch<{ data: PurchaseOrder; message: string }>(
      `/inventory/purchase-orders/${id}/status`,
      { status },
    ),

  getStockMovements: (params?: { inventory_item_id?: number; type?: string }) =>
    api.get<{ data: StockMovement[] }>('/inventory/stock-movements', { params }),

  recordMovement: (payload: {
    inventory_item_id: number
    type: 'in' | 'out'
    quantity: number
    notes?: string
  }) => api.post<{ data: StockMovement; message: string }>('/inventory/stock-movements', payload),

  lookupQr: (token: string) =>
    api.get<{ data: InventoryItem }>('/inventory/items/lookup', { params: { token } }),

  qrSvg: (id: number) =>
    api.get(`/inventory/items/${id}/qr`, {
      responseType: 'blob',
      headers: { Accept: 'image/svg+xml' },
    }),

  exportItems: (params?: { category?: string; status?: string }) =>
    api.get<{ data: Record<string, unknown>[] }>('/inventory/items/export', { params }),

  exportPurchaseOrders: (params?: { status?: string }) =>
    api.get<{ data: Record<string, unknown>[] }>('/inventory/purchase-orders/export', { params }),
}
