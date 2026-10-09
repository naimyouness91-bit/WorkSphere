import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import EventFiltersBar from '../components/calendar/EventFiltersBar'
import EventFormModal from '../components/calendar/EventFormModal'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  fetchEvents,
  openCreateForm,
  openEditForm,
  rescheduleEvent,
  setFilters,
} from '../store/eventsSlice'
import type { CalendarEvent } from '../types/event'
import { getEventLegend, mapToFullCalendarEvents } from '../utils/eventCalendar'

export default function CalendarPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { items, status, error, filters } = useAppSelector((state) => state.events)
  const [selectRange, setSelectRange] = useState<{ start?: Date; end?: Date }>({})
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    dispatch(fetchEvents(filters))
  }, [dispatch, filters])

  const canEdit = useCallback(
    (event: CalendarEvent) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'manager') return true
      return event.employee_id === user.id
    },
    [user],
  )

  const fcEvents = useMemo(
    () => mapToFullCalendarEvents(items, canEdit),
    [items, canEdit],
  )

  const handleEventClick = (info: EventClickArg) => {
    const event = info.event.extendedProps.event as CalendarEvent
    dispatch(openEditForm(event))
  }

  const handleSelect = (info: DateSelectArg) => {
    setSelectRange({ start: info.start, end: info.end })
    dispatch(openCreateForm())
  }

  const handleEventMove = async (info: EventDropArg | EventResizeDoneArg) => {
    const event = info.event.extendedProps.event as CalendarEvent
    if (!canEdit(event)) {
      info.revert()
      return
    }

    const start = info.event.start
    const end = info.event.end ?? start
    if (!start || !end) {
      info.revert()
      return
    }

    const result = await dispatch(
      rescheduleEvent({
        id: event.id,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      }),
    )

    if (rescheduleEvent.rejected.match(result)) {
      info.revert()
    }
  }

  const legend = getEventLegend()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {t('calendar.title')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('calendar.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectRange({})
            dispatch(openCreateForm())
          }}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          {t('calendar.newEvent')}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        {legend.map((item) => (
          <div key={item.type} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            {item.type === 'canceled'
              ? t('calendar.status.canceled')
              : t(`calendar.types.${item.type}`)}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <EventFiltersBar
          filters={filters}
          onChange={(f) => dispatch(setFilters(f))}
        />
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="calendar-theme mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-4">
        {status === 'loading' && (
          <p className="py-8 text-center text-sm text-slate-500">{t('calendar.loading')}</p>
        )}
        <div className={status === 'loading' ? 'hidden' : ''}>
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: isMobile
                ? 'listWeek,dayGridMonth'
                : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            height="auto"
            contentHeight={isMobile ? 480 : 620}
            events={fcEvents}
            editable
            selectable
            selectMirror
            dayMaxEvents
            nowIndicator
            eventClick={handleEventClick}
            select={handleSelect}
            eventDrop={handleEventMove}
            eventResize={handleEventMove}
            locale={document.documentElement.lang}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {t('calendar.dragHint')}
      </p>

      <EventFormModal
        initialStart={selectRange.start}
        initialEnd={selectRange.end}
      />
    </div>
  )
}
