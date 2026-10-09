import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import BarcodeScanner from '../components/inventory/BarcodeScanner'
import ItemQrCode from '../components/inventory/ItemQrCode'
import PoPipeline from '../components/inventory/PoPipeline'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppSelector } from '../hooks/redux'
import { inventoryApi } from '../services/inventoryApi'
import type {
  InventoryItem,
  InventoryStats,
  PurchaseOrder,
  PurchaseOrderStatus,
  StockMovement,
  Supplier,
} from '../types/inventory'

type Tab = 'items' | 'suppliers' | 'orders' | 'movements'

function parseScanToken(raw: string): string {
  try {
    const url = new URL(raw)
    return url.searchParams.get('scan') || raw
  } catch {
    return raw
  }
}

export default function InventoryPage() {
  const { t } = useTranslation()
  const { user } = useAppSelector((s) => s.auth)
  const [searchParams] = useSearchParams()
  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const [tab, setTab] = useState<Tab>('items')
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const [showAddItem, setShowAddItem] = useState(false)
  const [showAddPo, setShowAddPo] = useState(false)
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'equipment',
    quantity: '0',
    unit_price: '0',
    reorder_level: '10',
  })
  const [poForm, setPoForm] = useState({
    supplier_id: '',
    notes: '',
    line_item_id: '',
    line_qty: '1',
  })
  const [moveForm, setMoveForm] = useState({ item_id: '', type: 'out' as 'in' | 'out', qty: '1', notes: '' })

  const load = useCallback(async () => {
    try {
      const [overview, itemsRes, supRes, poRes, movRes] = await Promise.all([
        inventoryApi.overview(),
        inventoryApi.getItems({
          category: catFilter || undefined,
          status: statusFilter || undefined,
        }),
        inventoryApi.getSuppliers(),
        inventoryApi.getPurchaseOrders(),
        inventoryApi.getStockMovements(),
      ])
      setStats(overview.data.data.stats)
      setCategories(overview.data.data.categories)
      setItems(itemsRes.data.data)
      setSuppliers(supRes.data.data)
      setOrders(poRes.data.data)
      setMovements(movRes.data.data)
    } finally {
      setLoading(false)
    }
  }, [catFilter, statusFilter])

  // Re-show the loader while refetching after a filter change (adjust state
  // during render instead of setting it inside load()).
  const filterKey = `${catFilter}:${statusFilter}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setLoading(true)
  }

  useEffect(() => {
    if (!canManage) return
    void load()
  }, [load, canManage])

  const handleScan = async (raw: string) => {
    const token = parseScanToken(raw)
    try {
      const { data } = await inventoryApi.lookupQr(token)
      setSelectedItem(data.data)
      setTab('items')
    } catch {
      setSelectedItem(null)
    }
  }

  useEffect(() => {
    const scan = searchParams.get('scan')
    if (!scan || !canManage) return
    const token = parseScanToken(scan)
    inventoryApi
      .lookupQr(token)
      .then((res) => {
        setSelectedItem(res.data.data)
        setTab('items')
      })
      .catch(() => setSelectedItem(null))
  }, [searchParams, canManage])

  // Switch to the items view when the URL carries a scan token (adjust state
  // during render instead of setting it inside the effect).
  const scanParam = searchParams.get('scan') ?? ''
  const [prevScanParam, setPrevScanParam] = useState(scanParam)
  if (prevScanParam !== scanParam) {
    setPrevScanParam(scanParam)
    if (scanParam && canManage) {
      setTab('items')
    }
  }

  const exportItems = async () => {
    const { data } = await inventoryApi.exportItems({
      category: catFilter || undefined,
      status: statusFilter || undefined,
    })
    const sheet = XLSX.utils.json_to_sheet(data.data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Items')
    XLSX.writeFile(wb, 'worksphere-inventory.xlsx')
  }

  const exportPos = async () => {
    const { data } = await inventoryApi.exportPurchaseOrders()
    const sheet = XLSX.utils.json_to_sheet(data.data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'POs')
    XLSX.writeFile(wb, 'worksphere-purchase-orders.xlsx')
  }

  const submitItem = async () => {
    await inventoryApi.addItem({
      name: itemForm.name,
      category: itemForm.category,
      quantity: Number(itemForm.quantity),
      unit_price: Number(itemForm.unit_price),
      reorder_level: Number(itemForm.reorder_level),
    })
    setShowAddItem(false)
    void load()
  }

  const submitPo = async () => {
    if (!poForm.supplier_id || !poForm.line_item_id) return
    await inventoryApi.createPurchaseOrder({
      supplier_id: Number(poForm.supplier_id),
      notes: poForm.notes || undefined,
      items: [
        {
          inventory_item_id: Number(poForm.line_item_id),
          quantity: Number(poForm.line_qty),
        },
      ],
    })
    setShowAddPo(false)
    void load()
  }

  const submitMovement = async () => {
    if (!moveForm.item_id) return
    await inventoryApi.recordMovement({
      inventory_item_id: Number(moveForm.item_id),
      type: moveForm.type,
      quantity: Number(moveForm.qty),
      notes: moveForm.notes || undefined,
    })
    void load()
  }

  const onPoStatus = async (id: number, status: PurchaseOrderStatus) => {
    await inventoryApi.updatePurchaseOrderStatus(id, status)
    void load()
  }

  if (!canManage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-slate-600 dark:text-slate-400">
        {t('inventory.forbidden')}
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'items', label: t('inventory.tabItems') },
    { id: 'suppliers', label: t('inventory.tabSuppliers') },
    { id: 'orders', label: t('inventory.tabOrders') },
    { id: 'movements', label: t('inventory.tabMovements') },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-orange-700 to-amber-600 bg-clip-text text-3xl font-bold text-transparent dark:from-orange-400 dark:to-amber-400">
            {t('inventory.title')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void exportItems()} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600">
            {t('inventory.exportItems')}
          </button>
          <button type="button" onClick={() => void exportPos()} className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600">
            {t('inventory.exportPos')}
          </button>
          <button
            type="button"
            onClick={() => setShowAddItem(true)}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            {t('inventory.addItem')}
          </button>
          <button
            type="button"
            onClick={() => setShowAddPo(true)}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            {t('inventory.createPo')}
          </button>
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label={t('inventory.kpiItems')} value={stats?.total_items ?? 0} accent="orange" />
        <KpiCard label={t('inventory.kpiSuppliers')} value={stats?.active_suppliers ?? 0} accent="amber" />
        <KpiCard label={t('inventory.kpiPendingPo')} value={stats?.pending_pos ?? 0} accent="emerald" />
      </section>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTab(x.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === x.id
                ? 'border-orange-600 text-orange-700 dark:border-orange-400 dark:text-orange-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="mt-6">
          {tab === 'items' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm dark:bg-slate-800"
                  >
                    <option value="">{t('inventory.allCategories')}</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border px-3 py-2 text-sm dark:bg-slate-800"
                  >
                    <option value="">{t('inventory.allStatuses')}</option>
                    <option value="in_stock">{t('inventory.status.in_stock')}</option>
                    <option value="out_of_stock">{t('inventory.status.out_of_stock')}</option>
                  </select>
                </div>
                <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 text-start">{t('inventory.name')}</th>
                        <th className="px-4 py-3 text-start">{t('inventory.category')}</th>
                        <th className="px-4 py-3 text-end">{t('inventory.qty')}</th>
                        <th className="px-4 py-3 text-end">{t('inventory.unitPrice')}</th>
                        <th className="px-4 py-3">{t('inventory.statusLabel')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-800">
                      {items.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`cursor-pointer hover:bg-orange-50/50 dark:hover:bg-orange-950/20 ${
                            selectedItem?.id === item.id ? 'bg-orange-50 dark:bg-orange-950/30' : ''
                          }`}
                        >
                          <td className="px-4 py-3 font-medium">
                            {item.name}
                            {item.low_stock && (
                              <span className="ms-2 rounded bg-red-100 px-1.5 text-xs text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                {t('inventory.lowStock')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500">{item.category}</td>
                          <td className="px-4 py-3 text-end">{item.quantity}</td>
                          <td className="px-4 py-3 text-end">${item.unit_price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                item.status === 'in_stock'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              }`}
                            >
                              {t(`inventory.status.${item.status}`)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="space-y-4">
                <BarcodeScanner onScan={(token) => void handleScan(token)} />
                {selectedItem ? (
                  <div className="rounded-xl border p-4 dark:border-slate-700">
                    <h3 className="font-semibold">{selectedItem.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {t('inventory.qty')}: {selectedItem.quantity} · {t('inventory.reorder')}:{' '}
                      {selectedItem.reorder_level}
                    </p>
                    <div className="mt-3">
                      <ItemQrCode itemId={selectedItem.id} />
                    </div>
                    <p className="mt-2 font-mono text-xs text-slate-400">{selectedItem.qr_token}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">{t('inventory.selectItem')}</p>
                )}
              </div>
            </div>
          )}

          {tab === 'suppliers' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((s) => (
                <div key={s.id} className="rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">{s.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{s.contact_info}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-amber-500">★ {s.rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">
                      {s.purchase_orders_count ?? 0} {t('inventory.poCount')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'orders' && <PoPipeline orders={orders} canManage={canManage} onStatusChange={onPoStatus} />}

          {tab === 'movements' && (
            <div className="space-y-4">
              {canManage && (
                <div className="flex flex-wrap items-end gap-2 rounded-xl border p-4 dark:border-slate-700">
                  <div>
                    <label className="text-xs text-slate-500">{t('inventory.item')}</label>
                    <select
                      value={moveForm.item_id}
                      onChange={(e) => setMoveForm((f) => ({ ...f, item_id: e.target.value }))}
                      className="mt-1 block rounded border px-2 py-1.5 text-sm dark:bg-slate-800"
                    >
                      <option value="">—</option>
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">{t('inventory.moveType')}</label>
                    <select
                      value={moveForm.type}
                      onChange={(e) => setMoveForm((f) => ({ ...f, type: e.target.value as 'in' | 'out' }))}
                      className="mt-1 block rounded border px-2 py-1.5 text-sm dark:bg-slate-800"
                    >
                      <option value="in">{t('inventory.moveIn')}</option>
                      <option value="out">{t('inventory.moveOut')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">{t('inventory.qty')}</label>
                    <input
                      type="number"
                      min={1}
                      value={moveForm.qty}
                      onChange={(e) => setMoveForm((f) => ({ ...f, qty: e.target.value }))}
                      className="mt-1 block w-20 rounded border px-2 py-1.5 text-sm dark:bg-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void submitMovement()}
                    className="rounded-lg bg-orange-600 px-3 py-2 text-sm text-white"
                  >
                    {t('inventory.recordMovement')}
                  </button>
                </div>
              )}
              <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-start">{t('inventory.date')}</th>
                      <th className="px-4 py-3 text-start">{t('inventory.item')}</th>
                      <th className="px-4 py-3">{t('inventory.moveType')}</th>
                      <th className="px-4 py-3 text-end">{t('inventory.qty')}</th>
                      <th className="px-4 py-3 text-start">{t('inventory.by')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-3">{m.moved_at.slice(0, 16).replace('T', ' ')}</td>
                        <td className="px-4 py-3">{m.item?.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={
                              m.type === 'in'
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }
                          >
                            {m.type === 'in' ? '↓ IN' : '↑ OUT'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-end">{m.quantity}</td>
                        <td className="px-4 py-3 text-slate-500">{m.user?.name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">{t('inventory.addItem')}</h2>
            <div className="mt-4 space-y-3">
              <input
                placeholder={t('inventory.name')}
                value={itemForm.name}
                onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              />
              <input
                placeholder={t('inventory.category')}
                value={itemForm.category}
                onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder={t('inventory.qty')}
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="rounded border px-2 py-2 text-sm dark:bg-slate-800"
                />
                <input
                  type="number"
                  placeholder={t('inventory.unitPrice')}
                  value={itemForm.unit_price}
                  onChange={(e) => setItemForm((f) => ({ ...f, unit_price: e.target.value }))}
                  className="rounded border px-2 py-2 text-sm dark:bg-slate-800"
                />
                <input
                  type="number"
                  placeholder={t('inventory.reorder')}
                  value={itemForm.reorder_level}
                  onChange={(e) => setItemForm((f) => ({ ...f, reorder_level: e.target.value }))}
                  className="rounded border px-2 py-2 text-sm dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddItem(false)} className="rounded-lg border px-4 py-2 text-sm">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={() => void submitItem()} className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">{t('inventory.createPo')}</h2>
            <div className="mt-4 space-y-3">
              <select
                value={poForm.supplier_id}
                onChange={(e) => setPoForm((f) => ({ ...f, supplier_id: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              >
                <option value="">{t('inventory.selectSupplier')}</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={poForm.line_item_id}
                onChange={(e) => setPoForm((f) => ({ ...f, line_item_id: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              >
                <option value="">{t('inventory.selectItem')}</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={poForm.line_qty}
                onChange={(e) => setPoForm((f) => ({ ...f, line_qty: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddPo(false)} className="rounded-lg border px-4 py-2 text-sm">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={() => void submitPo()} className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white">
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
