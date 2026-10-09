import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  closePayrollForm,
  createPayroll,
  updatePayroll,
} from '../../store/payrollsSlice'
import type { Employee } from '../../types/employee'
import type { PayrollFormData } from '../../types/payroll'
import { emptyPayrollForm } from '../../types/payroll'
import { computeNetSalary, formatMoney } from '../../utils/currency'

interface Props {
  employees: Employee[]
}

export default function PayrollFormModal({ employees }: Props) {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, formMode, selectedRecord, mutationStatus } = useAppSelector(
    (state) => state.payrolls,
  )

  const [form, setForm] = useState<PayrollFormData>(emptyPayrollForm())

  // (Re)build the form each time the modal opens or switches mode/record.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${formMode === 'edit' ? selectedRecord?.id ?? 'new' : 'new'}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      if (formMode === 'edit' && selectedRecord) {
        setForm({
          employee_id: selectedRecord.employee_id,
          base_salary: selectedRecord.base_salary,
          bonuses: selectedRecord.bonuses,
          deductions: selectedRecord.deductions,
          pay_date: selectedRecord.pay_date,
        })
      } else {
        setForm({
          ...emptyPayrollForm(),
          employee_id: employees[0]?.id ?? 0,
        })
      }
    }
  }

  const previewNet = useMemo(
    () => computeNetSalary(form.base_salary, form.bonuses, form.deductions),
    [form.base_salary, form.bonuses, form.deductions],
  )

  if (!isFormOpen) {
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee_id) {
      return
    }
    if (formMode === 'create') {
      dispatch(createPayroll(form))
    } else if (selectedRecord) {
      dispatch(updatePayroll({ id: selectedRecord.id, data: form }))
    }
  }

  const field = (label: string, children: React.ReactNode) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
    </div>
  )

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payroll-form-title"
      >
        <h2
          id="payroll-form-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-50"
        >
          {formMode === 'create' ? t('payroll.newRecord') : t('payroll.editRecord')}
        </h2>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          {t('payroll.confidentialNotice')}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {field(
            t('payroll.employee'),
            <select
              required
              value={form.employee_id || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, employee_id: Number(e.target.value) }))
              }
              className={inputClass}
              disabled={formMode === 'edit'}
            >
              <option value="">{t('payroll.selectEmployee')}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.department}
                </option>
              ))}
            </select>,
          )}

          {field(
            t('payroll.baseSalary'),
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={form.base_salary}
              onChange={(e) =>
                setForm((f) => ({ ...f, base_salary: Number(e.target.value) }))
              }
              className={inputClass}
            />,
          )}

          {field(
            t('payroll.bonuses'),
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.bonuses}
              onChange={(e) =>
                setForm((f) => ({ ...f, bonuses: Number(e.target.value) }))
              }
              className={inputClass}
            />,
          )}

          {field(
            t('payroll.deductions'),
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.deductions}
              onChange={(e) =>
                setForm((f) => ({ ...f, deductions: Number(e.target.value) }))
              }
              className={inputClass}
            />,
          )}

          {field(
            t('payroll.payDate'),
            <input
              type="date"
              required
              value={form.pay_date}
              onChange={(e) => setForm((f) => ({ ...f, pay_date: e.target.value }))}
              className={inputClass}
            />,
          )}

          <div className="rounded-lg bg-indigo-50 px-4 py-3 dark:bg-indigo-950/40">
            <p className="text-xs font-medium uppercase text-indigo-600 dark:text-indigo-300">
              {t('payroll.netSalaryPreview')}
            </p>
            <p className="mt-1 text-xl font-bold text-indigo-900 dark:text-indigo-100">
              {formatMoney(previewNet, i18n.language)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('payroll.netFormula')}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closePayrollForm())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutationStatus === 'loading' ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
