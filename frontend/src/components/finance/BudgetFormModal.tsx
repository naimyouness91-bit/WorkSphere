import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  closeBudgetForm,
  createBudget,
  fetchBudgetDepartments,
  updateBudget,
} from '../../store/budgetsSlice'
import type { Budget, BudgetFormData, BudgetPeriod } from '../../types/budget'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

function formFromBudget(b: Budget | null): BudgetFormData {
  if (!b) {
    return {
      department: '',
      allocated_amount: 0,
      period: 'monthly',
      period_year: new Date().getFullYear(),
      period_month: new Date().getMonth() + 1,
    }
  }
  return {
    department: b.department,
    allocated_amount: b.allocated_amount,
    period: b.period,
    period_year: b.period_year,
    period_month: b.period_month,
  }
}

export default function BudgetFormModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, selectedBudget, departments, mutationStatus } = useAppSelector((s) => s.budgets)
  const [form, setForm] = useState<BudgetFormData>(formFromBudget(null))

  // (Re)build the form each time the modal opens for a different budget.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${selectedBudget?.id ?? 'new'}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      dispatch(fetchBudgetDepartments())
      setForm(formFromBudget(selectedBudget))
    }
  }

  if (!isFormOpen) return null

  const isEdit = Boolean(selectedBudget)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      allocated_amount: Number(form.allocated_amount),
      period_month: form.period === 'yearly' ? null : form.period_month,
    }
    if (isEdit && selectedBudget) {
      dispatch(updateBudget({ id: selectedBudget.id, data: payload }))
    } else {
      dispatch(createBudget(payload))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {isEdit ? t('budgets.editTitle') : t('budgets.createTitle')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('budgets.department')}</label>
            <input
              required
              list="departments-list"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              className={inputClass}
            />
            <datalist id="departments-list">
              {departments.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('budgets.allocated')}</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.allocated_amount || ''}
              onChange={(e) => setForm((f) => ({ ...f, allocated_amount: Number(e.target.value) }))}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('budgets.period')}</label>
              <select
                value={form.period}
                onChange={(e) =>
                  setForm((f) => ({ ...f, period: e.target.value as BudgetPeriod }))
                }
                className={inputClass}
              >
                <option value="monthly">{t('budgets.periodMonthly')}</option>
                <option value="yearly">{t('budgets.periodYearly')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('budgets.year')}</label>
              <input
                required
                type="number"
                min="2000"
                max="2100"
                value={form.period_year}
                onChange={(e) => setForm((f) => ({ ...f, period_year: Number(e.target.value) }))}
                className={inputClass}
              />
            </div>
          </div>
          {form.period === 'monthly' && (
            <div>
              <label className="mb-1 block text-sm font-medium">{t('budgets.month')}</label>
              <select
                value={form.period_month ?? 1}
                onChange={(e) => setForm((f) => ({ ...f, period_month: Number(e.target.value) }))}
                className={inputClass}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeBudgetForm())}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutationStatus === 'loading' ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
