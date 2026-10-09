import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeManageTicket, updateTicket } from '../../store/ticketsSlice'
import type { AppUser } from '../../types/userList'
import type { TicketStatus, TicketUpdateData } from '../../types/ticket'

interface Props {
  assignees: AppUser[]
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

export default function TicketManageModal({ assignees }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isManageOpen, selectedTicket, mutationStatus } = useAppSelector((s) => s.tickets)
  const [form, setForm] = useState<TicketUpdateData>({})

  // Rebuild the form from the selected ticket whenever the target changes.
  // Adjust state during render instead of setting it inside an effect.
  const tgtKey = `${isManageOpen}:${selectedTicket?.id ?? 'none'}`
  const [prevTgtKey, setPrevTgtKey] = useState(tgtKey)
  if (prevTgtKey !== tgtKey) {
    setPrevTgtKey(tgtKey)
    if (isManageOpen && selectedTicket) {
      setForm({
        status: selectedTicket.status,
        priority: selectedTicket.priority,
        assigned_to: selectedTicket.assigned_to,
      })
    }
  }

  if (!isManageOpen || !selectedTicket) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(updateTicket({ id: selectedTicket.id, data: form }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('tickets.manageTitle')}</h2>
        <p className="mt-1 truncate text-sm text-slate-500">{selectedTicket.title}</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tickets.statusLabel')}</label>
            <select
              value={form.status ?? selectedTicket.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as TicketStatus }))
              }
              className={inputClass}
            >
              <option value="open">{t('tickets.status.open')}</option>
              <option value="in_progress">{t('tickets.status.in_progress')}</option>
              <option value="resolved">{t('tickets.status.resolved')}</option>
              <option value="closed">{t('tickets.status.closed')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tickets.priorityLabel')}</label>
            <select
              value={form.priority ?? selectedTicket.priority}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  priority: e.target.value as TicketUpdateData['priority'],
                }))
              }
              className={inputClass}
            >
              <option value="low">{t('tickets.priority.low')}</option>
              <option value="medium">{t('tickets.priority.medium')}</option>
              <option value="high">{t('tickets.priority.high')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tickets.assignee')}</label>
            <select
              value={form.assigned_to ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  assigned_to: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className={inputClass}
            >
              <option value="">{t('tickets.unassigned')}</option>
              {assignees.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeManageTicket())}
              className="rounded-lg border px-4 py-2 text-sm dark:border-slate-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
