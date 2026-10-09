import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeTaskForm, createTask, updateTask } from '../../store/tasksSlice'
import type { Project } from '../../types/project'
import type { AppUser } from '../../types/userList'
import type { TaskFormData } from '../../types/task'
import { emptyTaskForm } from '../../types/task'

interface Props {
  projects: Project[]
  users: AppUser[]
}

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

export default function TaskFormModal({ projects, users }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, formMode, selectedTask, mutationStatus } = useAppSelector((s) => s.tasks)
  const [form, setForm] = useState<TaskFormData>(emptyTaskForm())

  // (Re)build the form each time the modal opens or switches mode/task.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${formMode === 'edit' ? selectedTask?.id ?? 'new' : 'new'}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      if (formMode === 'edit' && selectedTask) {
        setForm({
          project_id: selectedTask.project_id,
          title: selectedTask.title,
          description: selectedTask.description ?? '',
          assigned_to: selectedTask.assigned_to,
          due_date: selectedTask.due_date,
          status: selectedTask.status,
        })
      } else {
        setForm({
          ...emptyTaskForm(),
          project_id: projects[0]?.id ?? 0,
        })
      }
    }
  }

  if (!isFormOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: TaskFormData = {
      ...form,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date?.trim() ? form.due_date : null,
    }
    if (formMode === 'create') dispatch(createTask(payload))
    else if (selectedTask) dispatch(updateTask({ id: selectedTask.id, data: payload }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {formMode === 'create' ? t('tasks.newTask') : t('tasks.editTask')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tasks.project')}</label>
            <select
              required
              value={form.project_id || ''}
              onChange={(e) => setForm((f) => ({ ...f, project_id: Number(e.target.value) }))}
              className={inputClass}
            >
              <option value="">{t('tasks.selectProject')}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tasks.titleField')}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tasks.description')}</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('tasks.assignee')}</label>
            <select
              value={form.assigned_to ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  assigned_to: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className={inputClass}
            >
              <option value="">{t('tasks.unassigned')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('tasks.dueDate')}</label>
              <input
                type="date"
                value={form.due_date ?? ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value || null }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('tasks.statusLabel')}</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as TaskFormData['status'] }))
                }
                className={inputClass}
              >
                <option value="pending">{t('tasks.status.pending')}</option>
                <option value="in_progress">{t('tasks.status.in_progress')}</option>
                <option value="done">{t('tasks.status.done')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeTaskForm())}
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
