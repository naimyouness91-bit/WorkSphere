import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { createEvent, updateEvent, closeForm } from '../../store/eventsSlice'
import {
  EVENT_TYPES,
  emptyEventForm,
  eventToForm,
  toLocalInputValue,
  type EventFormData,
} from '../../types/event'

interface EventFormModalProps {
  initialStart?: Date
  initialEnd?: Date
}

export default function EventFormModal({ initialStart, initialEnd }: EventFormModalProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { isFormOpen, formMode, selectedEvent, mutationStatus } = useAppSelector(
    (state) => state.events,
  )
  const [form, setForm] = useState<EventFormData>(emptyEventForm())

  // (Re)build the form each time the modal opens or switches mode/event.
  // Adjust state during render instead of setting it inside an effect.
  const formKey = `${isFormOpen}:${formMode === 'edit' ? selectedEvent?.id ?? 'new' : 'new'}:${initialStart?.getTime() ?? ''}`
  const [prevFormKey, setPrevFormKey] = useState(formKey)
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey)
    if (isFormOpen) {
      if (formMode === 'edit' && selectedEvent) {
        setForm(eventToForm(selectedEvent))
      } else {
        const base = emptyEventForm()
        if (initialStart) {
          base.start_date = toLocalInputValue(initialStart)
        }
        if (initialEnd) {
          base.end_date = toLocalInputValue(initialEnd)
        }
        setForm(base)
      }
    }
  }

  if (!isFormOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (formMode === 'edit' && selectedEvent) {
      await dispatch(updateEvent({ id: selectedEvent.id, data: form }))
    } else {
      await dispatch(createEvent(form))
    }
  }

  const update = (key: keyof EventFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={() => dispatch(closeForm())}
        aria-hidden
      />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {formMode === 'edit' ? t('calendar.editEvent') : t('calendar.newEvent')}
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('calendar.title')} *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('calendar.description')}
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('calendar.type')} *
              </label>
              <select
                required
                value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className={inputClass}
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`calendar.types.${type}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('calendar.status')}
              </label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className={inputClass}
              >
                <option value="scheduled">{t('calendar.status.scheduled')}</option>
                <option value="canceled">{t('calendar.status.canceled')}</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('calendar.start')} *
              </label>
              <input
                type="datetime-local"
                required
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('calendar.end')} *
              </label>
              <input
                type="datetime-local"
                required
                value={form.end_date}
                onChange={(e) => update('end_date', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => dispatch(closeForm())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutationStatus === 'loading'}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutationStatus === 'loading' ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
