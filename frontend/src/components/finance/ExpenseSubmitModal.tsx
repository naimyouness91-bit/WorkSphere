import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeSubmitExpenseForm, createExpense } from '../../store/expensesSlice'
import type { ExpenseCategory, ExpenseSubmitData } from '../../types/expense'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

function emptyForm(): ExpenseSubmitData {
  return {
    title: '',
    description: '',
    amount: 0,
    category: 'other',
    date: new Date().toISOString().slice(0, 10),
  }
}

export default function ExpenseSubmitModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isSubmitOpen, mutationStatus } = useAppSelector((s) => s.expenses)
  const [form, setForm] = useState<ExpenseSubmitData>(emptyForm())

  // Reset the form whenever the modal opens (adjust state during render
  // instead of setting state inside an effect).
  const [prevOpen, setPrevOpen] = useState(isSubmitOpen)
  if (prevOpen !== isSubmitOpen) {
    setPrevOpen(isSubmitOpen)
    if (isSubmitOpen) {
      setForm(emptyForm())
    }
  }

  if (!isSubmitOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(createExpense({ ...form, amount: Number(form.amount) }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('finance.submitTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('finance.submitSubtitle')}</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('finance.titleField')}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('finance.description')}</label>
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('finance.amount')}</label>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('finance.date')}</label>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('finance.categoryLabel')}</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))
              }
              className={inputClass}
            >
              <option value="hr">{t('finance.category.hr')}</option>
              <option value="it">{t('finance.category.it')}</option>
              <option value="operations">{t('finance.category.operations')}</option>
              <option value="other">{t('finance.category.other')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeSubmitExpenseForm())}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutationStatus === 'loading' ? t('common.saving') : t('finance.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
