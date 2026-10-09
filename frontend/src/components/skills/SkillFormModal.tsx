import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeSkillForm, createSkill, updateSkill } from '../../store/skillsSlice'
import type { AppUser } from '../../types/userList'
import type { SkillFormData } from '../../types/skill'
import { emptySkillForm } from '../../types/skill'
import { SKILL_LEVEL_ORDER } from '../../utils/skillLevel'
import SkillLevelBar from './SkillLevelBar'

interface Props {
  users: AppUser[]
}

export default function SkillFormModal({ users }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, formMode, selectedSkill, mutationStatus } = useAppSelector((s) => s.skills)
  const [form, setForm] = useState<SkillFormData>(emptySkillForm())

  // (Re)build the form each time the modal opens or switches mode/skill.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${formMode === 'edit' ? selectedSkill?.id ?? 'new' : 'new'}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      if (formMode === 'edit' && selectedSkill) {
        setForm({
          name: selectedSkill.name,
          description: selectedSkill.description ?? '',
          employee_id: selectedSkill.employee_id,
          level: selectedSkill.level,
        })
      } else {
        const firstEmployee = users.find((u) => u.role === 'employee') ?? users[0]
        setForm({ ...emptySkillForm(), employee_id: firstEmployee?.id ?? 0 })
      }
    }
  }

  if (!isFormOpen) return null

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formMode === 'create') dispatch(createSkill(form))
    else if (selectedSkill) dispatch(updateSkill({ id: selectedSkill.id, data: form }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {formMode === 'create' ? t('skills.addSkill') : t('skills.editSkill')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('skills.name')}</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('skills.description')}</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('skills.employee')}</label>
            <select
              required
              value={form.employee_id || ''}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: Number(e.target.value) }))}
              className={inputClass}
            >
              <option value="">{t('skills.selectEmployee')}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('skills.level')}</label>
            <select
              value={form.level}
              onChange={(e) =>
                setForm((f) => ({ ...f, level: e.target.value as SkillFormData['level'] }))
              }
              className={inputClass}
            >
              {SKILL_LEVEL_ORDER.map((level) => (
                <option key={level} value={level}>
                  {t(`skills.levels.${level}`)}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <SkillLevelBar level={form.level} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dispatch(closeSkillForm())}
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
