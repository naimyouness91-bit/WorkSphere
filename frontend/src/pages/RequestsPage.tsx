import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import StatusBadge from '../components/StatusBadge'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  approveRequest,
  closeRequestForm,
  createRequest,
  fetchRequests,
  openRequestForm,
  rejectRequest,
} from '../store/requestsSlice'
import { addNotification } from '../store/notificationSlice'
import {
  REQUEST_TYPES,
  emptyRequestForm,
  type InternalRequestFormData,
} from '../types/internalRequest'

export default function RequestsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { items, status, error, mutationStatus, isFormOpen } = useAppSelector(
    (state) => state.requests,
  )
  const [form, setForm] = useState<InternalRequestFormData>(emptyRequestForm())

  const isApprover = user?.role === 'admin' || user?.role === 'manager'
  const canSubmit = user?.role === 'employee' || isApprover

  useEffect(() => {
    dispatch(fetchRequests()).then((result) => {
      if (fetchRequests.rejected.match(result)) {
        dispatch(
          addNotification({
            type: 'error',
            message: (result.payload as string) ?? t('requests.loadFailed'),
          }),
        )
      }
    })
  }, [dispatch, t])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await dispatch(createRequest(form))
    setForm(emptyRequestForm())
  }

  const handleApprove = (id: number) => dispatch(approveRequest(id))
  const handleReject = (id: number) => dispatch(rejectRequest(id))

  const updateForm = (field: keyof InternalRequestFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('requests.title')}</h1>
          <p className="mt-1 text-slate-600">
            {isApprover ? t('requests.subtitleApprover') : t('requests.subtitleEmployee')}
          </p>
        </div>
        {canSubmit && !isFormOpen && (
          <button
            type="button"
            onClick={() => dispatch(openRequestForm())}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            {t('requests.new')}
          </button>
        )}
      </div>

      {isFormOpen && canSubmit && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('requests.submitTitle')}</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="req-title" className="block text-sm font-medium text-slate-700">
                {t('requests.titleField')} *
              </label>
              <input
                id="req-title"
                required
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder={t('requests.titlePlaceholder')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="req-type" className="block text-sm font-medium text-slate-700">
                {t('requests.type')} *
              </label>
              <select
                id="req-type"
                required
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {REQUEST_TYPES.map((typeOption) => (
                  <option key={typeOption.value} value={typeOption.value}>
                    {t(`requests.types.${typeOption.value}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="req-desc" className="block text-sm font-medium text-slate-700">
                {t('requests.description')} *
              </label>
              <textarea
                id="req-desc"
                required
                rows={4}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder={t('requests.descriptionPlaceholder')}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={mutationStatus === 'loading'}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {mutationStatus === 'loading' ? t('requests.submitting') : t('requests.submit')}
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(closeRequestForm())
                  setForm(emptyRequestForm())
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('requests.cancel')}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {status === 'loading' ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('requests.loading')}</div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">
            {t('requests.empty')}
            {canSubmit && t('requests.emptyHint')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('requests.titleField')}
                  </th>
                  {isApprover && (
                    <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {t('requests.employee')}
                    </th>
                  )}
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('requests.type')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('home.status')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('requests.submitted')}
                  </th>
                  {isApprover && (
                    <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {t('employees.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{req.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {req.description}
                      </p>
                    </td>
                    {isApprover && (
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {req.employee?.name ?? '—'}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {t(`requests.types.${req.type}`)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    {isApprover && (
                      <td className="whitespace-nowrap px-6 py-4 text-end text-sm">
                        {req.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApprove(req.id)}
                              disabled={mutationStatus === 'loading'}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {t('requests.approve')}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(req.id)}
                              disabled={mutationStatus === 'loading'}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {t('requests.reject')}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {req.approver?.name
                              ? t('requests.approvedBy', { name: req.approver.name })
                              : '—'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
