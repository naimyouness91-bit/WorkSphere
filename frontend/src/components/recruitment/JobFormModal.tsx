import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeJobForm, createJob, updateJob } from '../../store/jobsSlice'
import type { JobFormData } from '../../types/job'
import { emptyJobForm } from '../../types/job'

export default function JobFormModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, formMode, selectedJob, mutationStatus } = useAppSelector((s) => s.jobs)
  const [form, setForm] = useState<JobFormData>(emptyJobForm())

  // (Re)build the form each time the modal opens or switches mode/job.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${formMode === 'edit' ? selectedJob?.id ?? 'new' : 'new'}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      if (formMode === 'edit' && selectedJob) {
        setForm({
          title: selectedJob.title,
          description: selectedJob.description,
          department: selectedJob.department,
          location: selectedJob.location,
          status: selectedJob.status,
        })
      } else {
        setForm(emptyJobForm())
      }
    }
  }

  if (!isFormOpen) return null

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formMode === 'create') dispatch(createJob(form))
    else if (selectedJob) dispatch(updateJob({ id: selectedJob.id, data: form }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {formMode === 'create' ? t('jobs.newJob') : t('jobs.editJob')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('jobs.title')}</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('jobs.description')}</label>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('jobs.department')}</label>
              <input required value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('jobs.location')}</label>
              <input required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('jobs.statusLabel')}</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as JobFormData['status'] }))} className={inputClass}>
              <option value="open">{t('jobs.status.open')}</option>
              <option value="closed">{t('jobs.status.closed')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => dispatch(closeJobForm())} className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">{t('common.cancel')}</button>
            <button type="submit" disabled={mutationStatus === 'loading'} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{mutationStatus === 'loading' ? t('common.loading') : t('common.save')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
