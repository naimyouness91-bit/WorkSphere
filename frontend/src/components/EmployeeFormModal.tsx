import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  closeForm,
  createEmployee,
  updateEmployee,
} from '../store/employeesSlice'
import type { Employee, EmployeeFormData } from '../types/employee'
import { emptyEmployeeForm } from '../types/employee'

function employeeToForm(employee: Employee): EmployeeFormData {
  return {
    name: employee.name,
    email: employee.email,
    phone: employee.phone ?? '',
    department: employee.department,
    position: employee.position,
    hire_date: employee.hire_date,
  }
}

export default function EmployeeFormModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, selectedEmployee, mutationStatus } = useAppSelector(
    (state) => state.employees,
  )
  const [form, setForm] = useState<EmployeeFormData>(emptyEmployeeForm())
  const isEdit = selectedEmployee !== null

  // Rebuild the form from the selected employee whenever the target changes.
  // Adjust state during render instead of setting it inside an effect.
  const empKey = selectedEmployee?.id ?? null
  const [prevEmpKey, setPrevEmpKey] = useState<number | null>(empKey)
  if (prevEmpKey !== empKey) {
    setPrevEmpKey(empKey)
    setForm(selectedEmployee ? employeeToForm(selectedEmployee) : emptyEmployeeForm())
  }

  if (!isFormOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isEdit && selectedEmployee) {
      await dispatch(updateEmployee({ id: selectedEmployee.id, data: form }))
    } else {
      await dispatch(createEmployee(form))
    }
  }

  const update = (field: keyof EmployeeFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={() => dispatch(closeForm())}
        aria-hidden
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">
          {isEdit ? t('employees.editTitle') : t('employees.createTitle')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="emp-name" className="block text-sm font-medium text-slate-700">
              {t('employees.name')} *
            </label>
            <input
              id="emp-name"
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="emp-email" className="block text-sm font-medium text-slate-700">
              {t('employees.email')} *
            </label>
            <input
              id="emp-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="emp-phone" className="block text-sm font-medium text-slate-700">
              {t('employees.phone')}
            </label>
            <input
              id="emp-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="emp-dept" className="block text-sm font-medium text-slate-700">
                {t('employees.department')} *
              </label>
              <input
                id="emp-dept"
                required
                value={form.department}
                onChange={(e) => update('department', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="emp-position" className="block text-sm font-medium text-slate-700">
                {t('employees.position')} *
              </label>
              <input
                id="emp-position"
                required
                value={form.position}
                onChange={(e) => update('position', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="emp-hire" className="block text-sm font-medium text-slate-700">
              {t('employees.hireDate')} *
            </label>
            <input
              id="emp-hire"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              value={form.hire_date}
              onChange={(e) => update('hire_date', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeForm())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {t('employees.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutationStatus === 'loading' ? t('employees.saving') : t('employees.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
