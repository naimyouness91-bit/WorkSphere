import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeLeaveForm, createLeave } from '../../store/leavesSlice'
import type { LeaveFormData } from '../../types/leave'
import { emptyLeaveForm } from '../../types/leave'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

export default function LeaveFormModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen } = useAppSelector((s) => s.leaves)
  const [form, setForm] = useState<LeaveFormData>(emptyLeaveForm())

  // Reset the form whenever the modal opens (adjust state during render
  // instead of setting state inside an effect).
  const [prevOpen, setPrevOpen] = useState(isFormOpen)
  if (prevOpen !== isFormOpen) {
    setPrevOpen(isFormOpen)
    if (isFormOpen) {
      setForm(emptyLeaveForm())
    }
  }

  if (!isFormOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(createLeave(form))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('leaves.requestTitle')}</h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('leaves.typeLabel')}</label>
            <select
              value={form.leave_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, leave_type: e.target.value as LeaveFormData['leave_type'] }))
              }
              className={inputClass}
            >
              <option value="sick">{t('leaves.type.sick')}</option>
              <option value="vacation">{t('leaves.type.vacation')}</option>
              <option value="unpaid">{t('leaves.type.unpaid')}</option>
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('leaves.startDate')}</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('leaves.endDate')}</label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('leaves.reason')}</label>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className={inputClass}
              placeholder={t('leaves.reasonPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dispatch(closeLeaveForm())}
              className="rounded-lg border px-4 py-2 text-sm dark:border-slate-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('leaves.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
