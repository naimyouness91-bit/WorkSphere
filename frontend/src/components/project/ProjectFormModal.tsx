import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeProjectForm, createProject, updateProject } from '../../store/projectsSlice'
import type { AppUser } from '../../types/userList'
import type { ProjectFormData } from '../../types/project'
import { emptyProjectForm } from '../../types/project'

interface Props {
  managers: AppUser[]
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

export default function ProjectFormModal({ managers }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, formMode, selectedProject, mutationStatus } = useAppSelector((s) => s.projects)
  const [form, setForm] = useState<ProjectFormData>(emptyProjectForm())

  // (Re)build the form each time the modal opens or switches mode/project.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${formMode === 'edit' ? selectedProject?.id ?? 'new' : 'new'}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      if (formMode === 'edit' && selectedProject) {
        setForm({
          title: selectedProject.title,
          description: selectedProject.description ?? '',
          start_date: selectedProject.start_date,
          end_date: selectedProject.end_date,
          manager_id: selectedProject.manager_id,
          status: selectedProject.status,
        })
      } else {
        const mgr = managers.find((u) => u.role === 'manager' || u.role === 'admin')
        setForm({ ...emptyProjectForm(), manager_id: mgr?.id ?? managers[0]?.id ?? 0 })
      }
    }
  }

  if (!isFormOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formMode === 'create') dispatch(createProject(form))
    else if (selectedProject) dispatch(updateProject({ id: selectedProject.id, data: form }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {formMode === 'create' ? t('projects.newProject') : t('projects.editProject')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('projects.titleField')}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('projects.description')}</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('projects.startDate')}</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('projects.endDate')}</label>
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
            <label className="mb-1 block text-sm font-medium">{t('projects.manager')}</label>
            <select
              required
              value={form.manager_id || ''}
              onChange={(e) => setForm((f) => ({ ...f, manager_id: Number(e.target.value) }))}
              className={inputClass}
            >
              {managers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('projects.statusLabel')}</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as ProjectFormData['status'] }))
              }
              className={inputClass}
            >
              <option value="active">{t('projects.status.active')}</option>
              <option value="completed">{t('projects.status.completed')}</option>
              <option value="on_hold">{t('projects.status.on_hold')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeProjectForm())}
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
