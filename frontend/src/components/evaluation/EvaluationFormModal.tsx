import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  closeEvaluationForm,
  createEvaluation,
  updateEvaluation,
} from '../../store/evaluationsSlice'
import type { AppUser } from '../../types/userList'
import type { EvaluationFormData } from '../../types/evaluation'
import { emptyEvaluationForm } from '../../types/evaluation'
import { scoreBarColor, scoreBarPercent } from '../../utils/evaluationScore'

interface Props {
  users: AppUser[]
}

export default function EvaluationFormModal({ users }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, formMode, selectedEvaluation, mutationStatus } = useAppSelector(
    (s) => s.evaluations,
  )
  const [form, setForm] = useState<EvaluationFormData>(emptyEvaluationForm())

  // (Re)build the form each time the modal opens or switches mode/target.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${formMode === 'edit' ? selectedEvaluation?.id ?? 'new' : 'new'}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      if (formMode === 'edit' && selectedEvaluation) {
        setForm({
          employee_id: selectedEvaluation.employee_id,
          review_period: selectedEvaluation.review_period,
          score: selectedEvaluation.score,
          comments: selectedEvaluation.comments ?? '',
          status: selectedEvaluation.status,
        })
      } else {
        const emp = users.find((u) => u.role === 'employee')
        setForm({
          ...emptyEvaluationForm(),
          employee_id: emp?.id ?? 0,
          review_period: `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
        })
      }
    }
  }

  if (!isFormOpen) return null

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formMode === 'create') dispatch(createEvaluation(form))
    else if (selectedEvaluation) dispatch(updateEvaluation({ id: selectedEvaluation.id, data: form }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {formMode === 'create' ? t('evaluations.newEvaluation') : t('evaluations.editEvaluation')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('evaluations.employee')}</label>
            <select
              required
              value={form.employee_id || ''}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: Number(e.target.value) }))}
              className={inputClass}
            >
              <option value="">{t('evaluations.selectEmployee')}</option>
              {users
                .filter((u) => u.role === 'employee')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('evaluations.reviewPeriod')}</label>
            <input
              required
              value={form.review_period}
              onChange={(e) => setForm((f) => ({ ...f, review_period: e.target.value }))}
              placeholder="2026-Q1"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t('evaluations.score')} (0–5)
            </label>
            <input
              type="range"
              min={0}
              max={5}
              step={0.1}
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="mt-2 flex items-center gap-3">
              <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                {form.score.toFixed(1)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full ${scoreBarColor(form.score)}`}
                  style={{ width: `${scoreBarPercent(form.score)}%` }}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('evaluations.comments')}</label>
            <textarea
              rows={4}
              value={form.comments}
              onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
              className={inputClass}
              placeholder={t('evaluations.commentsPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('evaluations.statusLabel')}</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as EvaluationFormData['status'],
                }))
              }
              className={inputClass}
            >
              <option value="draft">{t('evaluations.status.draft')}</option>
              <option value="submitted">{t('evaluations.status.submitted')}</option>
              <option value="finalized">{t('evaluations.status.finalized')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dispatch(closeEvaluationForm())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {mutationStatus === 'loading' ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
