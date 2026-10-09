import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { settingsApi } from '../../services/settingsApi'
import type { UserRole, Workflow, WorkflowDomain, WorkflowStep } from '../../types/settings'
import { addNotification } from '../../store/notificationSlice'

const DOMAINS: WorkflowDomain[] = ['general', 'hr', 'finance', 'procurement', 'it']
const ROLES: UserRole[] = ['admin', 'manager', 'employee']

interface Props {
  workflows: Workflow[]
  onRefresh: () => void
}

function emptyStep(order: number): WorkflowStep {
  return { order, name: `Step ${order}`, approver_role: 'manager' }
}

export default function WorkflowBuilder({ workflows, onRefresh }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [domain, setDomain] = useState<WorkflowDomain>('general')
  const [assignedRoles, setAssignedRoles] = useState<UserRole[]>(['manager', 'admin'])
  const [steps, setSteps] = useState<WorkflowStep[]>([emptyStep(1), emptyStep(2)])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const reorder = useCallback((from: number, to: number) => {
    setSteps((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }, [])

  const handleDrop = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return
    reorder(dragIndex, toIndex)
    setDragIndex(null)
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const { data } = await settingsApi.addWorkflow({
        title: title.trim(),
        description: description.trim() || null,
        domain,
        assigned_roles: assignedRoles,
        steps,
        is_active: true,
      })
      dispatch(addNotification({ type: 'success', message: data.message }))
      setTitle('')
      setDescription('')
      setSteps([emptyStep(1), emptyStep(2)])
      onRefresh()
    } catch {
      dispatch(addNotification({ type: 'error', message: t('settings.workflowSaveFailed') }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {canEdit && (
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('settings.newWorkflow')}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('settings.workflowTitle')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            />
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as WorkflowDomain)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {DOMAINS.map((d) => (
                <option key={d} value={d}>
                  {t(`settings.domain.${d}`)}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('settings.workflowDescription')}
            rows={2}
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />

          <p className="mt-4 text-xs font-medium text-slate-500">{t('settings.dragSteps')}</p>
          <ul className="mt-2 space-y-2">
            {steps.map((step, index) => (
              <li
                key={`${step.order}-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className="flex cursor-grab flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-800/50"
              >
                <span className="text-slate-400">⋮⋮</span>
                <input
                  value={step.name}
                  onChange={(e) =>
                    setSteps((s) =>
                      s.map((st, i) => (i === index ? { ...st, name: e.target.value } : st)),
                    )
                  }
                  className="min-w-[8rem] flex-1 rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
                <select
                  value={step.approver_role ?? 'manager'}
                  onChange={(e) =>
                    setSteps((s) =>
                      s.map((st, i) =>
                        i === index ? { ...st, approver_role: e.target.value as UserRole } : st,
                      ),
                    )
                  }
                  className="rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSteps((s) => s.filter((_, i) => i !== index).map((st, i) => ({ ...st, order: i + 1 })))
                  }
                  className="text-xs text-red-600 hover:underline"
                >
                  {t('common.delete')}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSteps((s) => [...s, emptyStep(s.length + 1)])}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600"
            >
              {t('settings.addStep')}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleCreate()}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('settings.createWorkflow')}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <label key={r} className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={assignedRoles.includes(r)}
                  onChange={(e) =>
                    setAssignedRoles((prev) =>
                      e.target.checked ? [...prev, r] : prev.filter((x) => x !== r),
                    )
                  }
                />
                {r}
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t('settings.existingWorkflows')}
        </h3>
        {workflows.length === 0 ? (
          <p className="text-sm text-slate-500">{t('settings.noWorkflows')}</p>
        ) : (
          workflows.map((w) => (
            <article
              key={w.id}
              className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-slate-50">{w.title}</h4>
                  <p className="text-xs text-slate-500">
                    {t(`settings.domain.${w.domain}`)} · {(w.assigned_roles ?? []).join(', ') || t('settings.allRoles')}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                  {w.steps.length} {t('settings.steps')}
                </span>
              </div>
              {w.description && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{w.description}</p>
              )}
              <ol className="mt-3 space-y-1 border-s border-slate-100 ps-4 dark:border-slate-800">
                {w.steps.map((step) => (
                  <li key={step.order} className="text-sm text-slate-700 dark:text-slate-300">
                    {step.order}. {step.name}{' '}
                    <span className="text-xs text-slate-400">({step.approver_role})</span>
                  </li>
                ))}
              </ol>
            </article>
          ))
        )}
      </section>
    </div>
  )
}
