import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Invoice, InvoiceStatus } from '../../types/accounting'
import { formatMoney } from '../../utils/currency'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

interface Props {
  invoices: Invoice[]
  canManage: boolean
  onStatusChange: (id: number, status: InvoiceStatus) => void
  onCreate: (payload: { client_id: number; amount: number; due_date: string; notes?: string }) => void
  clients: { id: number; name: string; company: string }[]
}

export default function InvoiceManager({ invoices, canManage, onStatusChange, onCreate, clients }: Props) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ client_id: '', amount: '', due_date: '', notes: '' })

  const filtered = filter ? invoices.filter((i) => i.status === filter) : invoices

  const submit = () => {
    if (!form.client_id || !form.amount || !form.due_date) return
    onCreate({
      client_id: Number(form.client_id),
      amount: Number(form.amount),
      due_date: form.due_date,
      notes: form.notes || undefined,
    })
    setShowForm(false)
    setForm({ client_id: '', amount: '', due_date: '', notes: '' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('finance.allInvoiceStatuses')}</option>
          <option value="pending">{t('finance.invoiceStatus.pending')}</option>
          <option value="paid">{t('finance.invoiceStatus.paid')}</option>
          <option value="overdue">{t('finance.invoiceStatus.overdue')}</option>
        </select>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
          >
            {t('finance.newInvoice')}
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-start">{t('finance.invoiceNumber')}</th>
              <th className="px-4 py-3 text-start">{t('finance.client')}</th>
              <th className="px-4 py-3 text-end">{t('finance.amount')}</th>
              <th className="px-4 py-3">{t('finance.dueDate')}</th>
              <th className="px-4 py-3">{t('finance.statusLabel')}</th>
              {canManage && <th className="px-4 py-3">{t('finance.actions')}</th>}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800">
            {filtered.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 font-mono font-medium">{inv.invoice_number}</td>
                <td className="px-4 py-3">{inv.client?.name ?? '—'}</td>
                <td className="px-4 py-3 text-end">{formatMoney(inv.amount)}</td>
                <td className="px-4 py-3 text-center">{inv.due_date}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[inv.status]}`}>
                    {t(`finance.invoiceStatus.${inv.status}`)}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-3">
                    {inv.status !== 'paid' && (
                      <select
                        value={inv.status}
                        onChange={(e) => onStatusChange(inv.id, e.target.value as InvoiceStatus)}
                        className="rounded border px-2 py-1 text-xs dark:bg-slate-800"
                      >
                        <option value="pending">{t('finance.invoiceStatus.pending')}</option>
                        <option value="paid">{t('finance.invoiceStatus.paid')}</option>
                        <option value="overdue">{t('finance.invoiceStatus.overdue')}</option>
                      </select>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-8 text-center text-slate-500">{t('finance.noInvoices')}</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-slate-900">
            <h3 className="text-lg font-semibold">{t('finance.newInvoice')}</h3>
            <div className="mt-4 space-y-3">
              <select
                value={form.client_id}
                onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              >
                <option value="">{t('finance.selectClient')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder={t('finance.amount')}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              />
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">
                {t('common.cancel')}
              </button>
              <button type="button" onClick={submit} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
