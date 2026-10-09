import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeSubmitTicketForm, createTicket } from '../../store/ticketsSlice'
import type { TicketSubmitData } from '../../types/ticket'
import { emptyTicketSubmit } from '../../types/ticket'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

export default function TicketSubmitModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isSubmitOpen, mutationStatus } = useAppSelector((s) => s.tickets)
  const [form, setForm] = useState<TicketSubmitData>(emptyTicketSubmit())

  // Reset the form whenever the modal opens (adjust state during render
  // instead of setting state inside an effect).
  const [prevOpen, setPrevOpen] = useState(isSubmitOpen)
  if (prevOpen !== isSubmitOpen) {
    setPrevOpen(isSubmitOpen)
    if (isSubmitOpen) {
      setForm(emptyTicketSubmit())
    }
  }

  if (!isSubmitOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(createTicket(form))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('tickets.submitTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('tickets.submitSubtitle')}</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tickets.titleField')}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tickets.description')}</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('tickets.categoryLabel')}</label>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value as TicketSubmitData['category'] }))
                }
                className={inputClass}
              >
                <option value="it">{t('tickets.category.it')}</option>
                <option value="hr">{t('tickets.category.hr')}</option>
                <option value="finance">{t('tickets.category.finance')}</option>
                <option value="other">{t('tickets.category.other')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('tickets.priorityLabel')}</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as TicketSubmitData['priority'] }))
                }
                className={inputClass}
              >
                <option value="low">{t('tickets.priority.low')}</option>
                <option value="medium">{t('tickets.priority.medium')}</option>
                <option value="high">{t('tickets.priority.high')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeSubmitTicketForm())}
              className="rounded-lg border px-4 py-2 text-sm dark:border-slate-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('tickets.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
