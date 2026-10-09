import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import AssetQrCode from '../components/assets/AssetQrCode'
import AssetStatusBadge from '../components/assets/AssetStatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppSelector } from '../hooks/redux'
import { api } from '../services/api'
import { assetsApi } from '../services/assetsApi'
import type { Asset, AssetHistory, AssetStatus, AssetType } from '../types/asset'

interface EmployeeOption {
  id: number
  name: string
}

export default function AssetsPage() {
  const { t } = useTranslation()
  const { user } = useAppSelector((state) => state.auth)
  const [searchParams] = useSearchParams()
  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Asset | null>(null)
  const [history, setHistory] = useState<AssetHistory | null>(null)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])

  const [showAdd, setShowAdd] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)

  const [addForm, setAddForm] = useState({
    name: '',
    type: 'equipment' as AssetType,
    serial_number: '',
    purchase_date: '',
    status: 'active' as AssetStatus,
    notes: '',
  })
  const [assignForm, setAssignForm] = useState({
    employee_id: '',
    assigned_date: new Date().toISOString().slice(0, 10),
    expected_return_date: '',
    notes: '',
  })
  const [maintForm, setMaintForm] = useState({ description: '', scheduled_date: '' })

  const load = useCallback(() => {
    assetsApi
      .list({
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      })
      .then((res) => setAssets(res.data.data))
      .finally(() => setLoading(false))
  }, [typeFilter, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  // Re-show the loader while refetching after a filter change (adjust state
  // during render instead of setting it inside load()).
  const filterKey = `${typeFilter}:${statusFilter}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey)
    setLoading(true)
  }

  // Apply the status filter coming from the URL (adjust state during render).
  const statusParam = searchParams.get('status')
  const [prevStatusParam, setPrevStatusParam] = useState(statusParam)
  if (prevStatusParam !== statusParam) {
    setPrevStatusParam(statusParam)
    if (statusParam) setStatusFilter(statusParam)
  }

  useEffect(() => {
    if (!canManage) return
    api.get<{ data: Array<{ id: number; name: string; role: string }> }>('/users').then((res) => {
      setEmployees(res.data.data.filter((u) => u.role === 'employee').map((u) => ({ id: u.id, name: u.name })))
    })
  }, [canManage])

  useEffect(() => {
    const scan = searchParams.get('scan')
    if (!scan) return
    assetsApi.lookupQr(scan).then((res) => {
      setSelected(res.data.data.asset)
      setHistory(res.data.data.history)
    })
  }, [searchParams])

  const openDetail = async (asset: Asset) => {
    setSelected(asset)
    setShowAssign(false)
    setShowMaintenance(false)
    const res = await assetsApi.history(asset.id)
    setHistory(res.data.data)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    await assetsApi.create(addForm)
    setShowAdd(false)
    setAddForm({
      name: '',
      type: 'equipment',
      serial_number: '',
      purchase_date: '',
      status: 'active',
      notes: '',
    })
    load()
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    await assetsApi.assign(selected.id, {
      ...assignForm,
      employee_id: Number(assignForm.employee_id),
    })
    setShowAssign(false)
    load()
    const updated = (await assetsApi.get(selected.id)).data.data
    await openDetail(updated)
  }

  const handleReturn = async () => {
    if (!selected) return
    await assetsApi.return(selected.id)
    load()
    const updated = await assetsApi.get(selected.id).then((r) => r.data.data)
    setSelected(updated)
    const h = await assetsApi.history(selected.id)
    setHistory(h.data.data)
  }

  const handleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    await assetsApi.scheduleMaintenance(selected.id, maintForm)
    setShowMaintenance(false)
    setMaintForm({ description: '', scheduled_date: '' })
    load()
    openDetail(selected)
  }

  const handleCompleteMaintenance = async (id: number) => {
    await assetsApi.completeMaintenance(id)
    if (selected) openDetail(selected)
    load()
  }

  const exportExcel = async () => {
    const res = await assetsApi.export({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
    })
    const sheet = XLSX.utils.json_to_sheet(res.data.data)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Assets')
    XLSX.writeFile(book, `worksphere-assets-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const exportCsv = async () => {
    const res = await assetsApi.export({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
    })
    const sheet = XLSX.utils.json_to_sheet(res.data.data)
    const csv = XLSX.utils.sheet_to_csv(sheet)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `worksphere-assets-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('assets.title')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{t('assets.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white dark:bg-slate-600"
            >
              {t('assets.addAsset')}
            </button>
          )}
          {canManage && (
            <>
              <button
                type="button"
                onClick={exportExcel}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
              >
                {t('assets.exportExcel')}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
              >
                {t('assets.exportCsv')}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('assets.allTypes')}</option>
          <option value="equipment">{t('assets.types.equipment')}</option>
          <option value="vehicle">{t('assets.types.vehicle')}</option>
          <option value="license">{t('assets.types.license')}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('assets.allStatuses')}</option>
          <option value="active">{t('assets.status.active')}</option>
          <option value="inactive">{t('assets.status.inactive')}</option>
          <option value="maintenance">{t('assets.status.maintenance')}</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {loading ? (
            <LoadingSpinner label={t('assets.loading')} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">{t('assets.name')}</th>
                    <th className="px-4 py-3">{t('assets.type')}</th>
                    <th className="px-4 py-3">{t('assets.statusLabel')}</th>
                    <th className="px-4 py-3">{t('assets.assignedTo')}</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => openDetail(asset)}
                      className={`cursor-pointer border-t border-slate-100 dark:border-slate-700 ${
                        selected?.id === asset.id ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{asset.name}</td>
                      <td className="px-4 py-3 capitalize">{t(`assets.types.${asset.type}`)}</td>
                      <td className="px-4 py-3">
                        <AssetStatusBadge status={asset.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {asset.active_assignment?.employee?.name ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assets.length === 0 && (
                <p className="px-4 py-8 text-center text-slate-500">{t('assets.empty')}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {!selected ? (
            <p className="text-sm text-slate-500">{t('assets.selectAsset')}</p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-xs text-slate-500">{selected.serial_number ?? t('assets.noSerial')}</p>
                <div className="mt-2">
                  <AssetStatusBadge status={selected.status} />
                </div>
              </div>

              <AssetQrCode assetId={selected.id} />
              <p className="text-xs text-slate-500">{t('assets.qrHint')}</p>

              {canManage && (
                <div className="flex flex-wrap gap-2">
                  {selected.is_assigned ? (
                    <button
                      type="button"
                      onClick={handleReturn}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium"
                    >
                      {t('assets.returnAsset')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAssign(true)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      {t('assets.assign')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMaintenance(true)}
                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:text-amber-200"
                  >
                    {t('assets.scheduleMaintenance')}
                  </button>
                </div>
              )}

              {showAssign && canManage && (
                <form onSubmit={handleAssign} className="space-y-2 rounded-lg border p-3 dark:border-slate-600">
                  <select
                    required
                    value={assignForm.employee_id}
                    onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                    className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-900"
                  >
                    <option value="">{t('assets.selectEmployee')}</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={assignForm.expected_return_date}
                    onChange={(e) => setAssignForm({ ...assignForm, expected_return_date: e.target.value })}
                    className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-900"
                  />
                  <button type="submit" className="w-full rounded bg-indigo-600 py-1.5 text-sm text-white">
                    {t('assets.confirmAssign')}
                  </button>
                </form>
              )}

              {showMaintenance && canManage && (
                <form onSubmit={handleMaintenance} className="space-y-2 rounded-lg border p-3 dark:border-slate-600">
                  <textarea
                    required
                    value={maintForm.description}
                    onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
                    placeholder={t('assets.maintDescription')}
                    className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-900"
                    rows={2}
                  />
                  <input
                    type="date"
                    required
                    value={maintForm.scheduled_date}
                    onChange={(e) => setMaintForm({ ...maintForm, scheduled_date: e.target.value })}
                    className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-900"
                  />
                  <button type="submit" className="w-full rounded bg-amber-600 py-1.5 text-sm text-white">
                    {t('assets.confirmMaintenance')}
                  </button>
                </form>
              )}

              {history && (
                <div className="space-y-3 border-t pt-3 dark:border-slate-600">
                  <h3 className="text-sm font-semibold">{t('assets.history')}</h3>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{t('assets.assignments')}</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {history.assignments.map((a) => (
                        <li key={a.id}>
                          {a.employee_name} · {a.assigned_date}
                          {a.return_date ? ` → ${a.return_date}` : ` (${t('assets.active')})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">{t('assets.maintenance')}</p>
                    <ul className="mt-1 space-y-2 text-xs">
                      {history.maintenances.map((m) => (
                        <li key={m.id} className="flex justify-between gap-2">
                          <span>
                            {m.description} ({m.scheduled_date})
                          </span>
                          {m.is_pending && canManage && (
                            <button
                              type="button"
                              onClick={() => handleCompleteMaintenance(m.id)}
                              className="shrink-0 text-indigo-600 underline"
                            >
                              {t('assets.complete')}
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAdd && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAdd}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800"
          >
            <h2 className="text-lg font-semibold">{t('assets.addAsset')}</h2>
            <div className="mt-4 space-y-3">
              <input
                required
                placeholder={t('assets.name')}
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <select
                value={addForm.type}
                onChange={(e) => setAddForm({ ...addForm, type: e.target.value as AssetType })}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="equipment">{t('assets.types.equipment')}</option>
                <option value="vehicle">{t('assets.types.vehicle')}</option>
                <option value="license">{t('assets.types.license')}</option>
              </select>
              <input
                placeholder={t('assets.serial')}
                value={addForm.serial_number}
                onChange={(e) => setAddForm({ ...addForm, serial_number: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
              <input
                type="date"
                value={addForm.purchase_date}
                onChange={(e) => setAddForm({ ...addForm, purchase_date: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm">
                {t('common.cancel')}
              </button>
              <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white">
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
