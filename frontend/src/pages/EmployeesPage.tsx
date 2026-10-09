import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmModal from '../components/ConfirmModal'
import EmployeeFormModal from '../components/EmployeeFormModal'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  closeDeleteModal,
  deleteEmployee,
  fetchEmployees,
  openCreateForm,
  openDeleteModal,
  openEditForm,
} from '../store/employeesSlice'
import { addNotification } from '../store/notificationSlice'

export default function EmployeesPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const {
    items,
    status,
    error,
    mutationStatus,
    isDeleteModalOpen,
    employeeToDelete,
  } = useAppSelector((state) => state.employees)

  useEffect(() => {
    dispatch(fetchEmployees()).then((result) => {
      if (fetchEmployees.rejected.match(result)) {
        dispatch(
          addNotification({
            type: 'error',
            message: (result.payload as string) ?? t('employees.loadFailed'),
          }),
        )
      }
    })
  }, [dispatch, t])

  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      dispatch(deleteEmployee(employeeToDelete.id))
    }
  }

  const totalLabel =
    items.length === 1
      ? t('employees.total', { count: items.length })
      : t('employees.total_plural', { count: items.length })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('employees.title')}</h1>
          <p className="mt-1 text-slate-600">{t('employees.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(openCreateForm())}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          {t('employees.add')}
        </button>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {status === 'loading' ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('employees.loading')}</div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('employees.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('employees.name')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('employees.email')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('employees.phone')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('employees.department')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('employees.position')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('employees.hireDate')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('employees.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {employee.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {employee.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {employee.phone || '—'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {employee.department}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {employee.position}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {employee.hire_date}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-end text-sm">
                      <button
                        type="button"
                        onClick={() => dispatch(openEditForm(employee))}
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        {t('employees.edit')}
                      </button>
                      <span className="mx-2 text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => dispatch(openDeleteModal(employee))}
                        className="font-medium text-red-600 hover:text-red-800"
                      >
                        {t('employees.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-slate-500">{totalLabel}</p>

      <EmployeeFormModal />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('employees.deleteTitle')}
        message={
          employeeToDelete
            ? t('employees.deleteMessage', { name: employeeToDelete.name })
            : ''
        }
        confirmLabel={t('employees.confirmDelete')}
        cancelLabel={t('common.cancel')}
        isLoading={mutationStatus === 'loading'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => dispatch(closeDeleteModal())}
      />
    </div>
  )
}
