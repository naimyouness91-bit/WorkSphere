import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  closeTrainingForm,
  createTraining,
  updateTraining,
} from '../../store/trainingsSlice'
import type { AppUser } from '../../types/userList'
import type { TrainingFormData } from '../../types/training'
import { emptyTrainingForm } from '../../types/training'

interface Props {
  users: AppUser[]
}

export default function TrainingFormModal({ users }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, formMode, selectedTraining, mutationStatus } = useAppSelector(
    (s) => s.trainings,
  )
  const [form, setForm] = useState<TrainingFormData>(emptyTrainingForm())

  // (Re)build the form each time the modal opens or switches mode/training.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${formMode === 'edit' ? selectedTraining?.id ?? 'new' : 'new'}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      if (formMode === 'edit' && selectedTraining) {
        setForm({
          title: selectedTraining.title,
          description: selectedTraining.description ?? '',
          start_date: selectedTraining.start_date.slice(0, 16),
          end_date: selectedTraining.end_date.slice(0, 16),
          trainer_id: selectedTraining.trainer_id,
          status: selectedTraining.status,
          assignee_ids: selectedTraining.assignee_ids ?? selectedTraining.assignees?.map((a) => a.id) ?? [],
        })
      } else {
        const defaultTrainer = users.find((u) => u.role === 'manager') ?? users[0]
        setForm({
          ...emptyTrainingForm(),
          trainer_id: defaultTrainer?.id ?? 0,
        })
      }
    }
  }

  if (!isFormOpen) return null

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  const toggleAssignee = (id: number) => {
    setForm((f) => ({
      ...f,
      assignee_ids: f.assignee_ids.includes(id)
        ? f.assignee_ids.filter((x) => x !== id)
        : [...f.assignee_ids, id],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formMode === 'create') {
      dispatch(createTraining(form))
    } else if (selectedTraining) {
      dispatch(updateTraining({ id: selectedTraining.id, data: form }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {formMode === 'create' ? t('training.assignTraining') : t('training.editTraining')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('training.title')}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('training.description')}</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('training.start')}</label>
              <input
                type="datetime-local"
                required
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{t('training.end')}</label>
              <input
                type="datetime-local"
                required
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('training.trainer')}</label>
            <select
              required
              value={form.trainer_id || ''}
              onChange={(e) => setForm((f) => ({ ...f, trainer_id: Number(e.target.value) }))}
              className={inputClass}
            >
              <option value="">{t('training.selectTrainer')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({t(`roles.${u.role}`)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('training.statusLabel')}</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as TrainingFormData['status'],
                }))
              }
              className={inputClass}
            >
              <option value="scheduled">{t('training.status.scheduled')}</option>
              <option value="completed">{t('training.status.completed')}</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t('training.assignees')}</label>
            <div className="max-h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
              {users
                .filter((u) => u.role === 'employee')
                .map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.assignee_ids.includes(u.id)}
                      onChange={() => toggleAssignee(u.id)}
                    />
                    {u.name}
                  </label>
                ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeTrainingForm())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
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
