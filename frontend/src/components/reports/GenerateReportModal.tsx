import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeGenerateReport, generateReport } from '../../store/reportsSlice'
import type { ReportFormData, ReportType, ScheduleFrequency } from '../../types/report'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900'

export default function GenerateReportModal() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isGenerateOpen, mutationStatus, filters } = useAppSelector((s) => s.reports)
  const [form, setForm] = useState<ReportFormData>({
    title: '',
    description: '',
    type: 'requests',
    date_from: filters.date_from,
    date_to: filters.date_to,
    department: filters.department || undefined,
    is_scheduled: false,
  })

  // Rebuild the form each time the modal opens. Adjust state during render
  // instead of setting it inside an effect.
  const [prevOpen, setPrevOpen] = useState(isGenerateOpen)
  if (prevOpen !== isGenerateOpen) {
    setPrevOpen(isGenerateOpen)
    if (isGenerateOpen) {
      setForm({
        title: '',
        description: '',
        type: filters.module === 'all' ? 'requests' : filters.module,
        date_from: filters.date_from,
        date_to: filters.date_to,
        department: filters.department || undefined,
        is_scheduled: false,
      })
    }
  }

  if (!isGenerateOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(generateReport(form))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <h2 className="text-lg font-semibold">{t('reports.generateTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('reports.generateSubtitle')}</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('reports.reportTitle')}</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('reports.description')}</label>
            <textarea
              rows={2}
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('reports.type')}</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ReportType }))}
              className={inputClass}
            >
              {(['requests', 'payroll', 'attendance', 'finance', 'performance', 'hr'] as ReportType[]).map((type) => (
                <option key={type} value={type}>
                  {t(`reports.modules.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_scheduled ?? false}
              onChange={(e) => setForm((f) => ({ ...f, is_scheduled: e.target.checked }))}
              className="rounded border-slate-300"
            />
            {t('reports.enableSchedule')}
          </label>
          {form.is_scheduled && (
            <div>
              <label className="mb-1 block text-sm font-medium">{t('reports.scheduleFrequency')}</label>
              <select
                value={form.schedule_frequency ?? 'weekly'}
                onChange={(e) =>
                  setForm((f) => ({ ...f, schedule_frequency: e.target.value as ScheduleFrequency }))
                }
                className={inputClass}
              >
                <option value="weekly">{t('reports.weekly')}</option>
                <option value="monthly">{t('reports.monthly')}</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">{t('reports.scheduleHint')}</p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeGenerateReport())}
              className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutationStatus === 'loading' ? t('common.saving') : t('reports.generate')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
