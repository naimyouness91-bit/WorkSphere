import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import type { EventClickArg } from '@fullcalendar/core'
import TrainingFiltersBar from '../components/training/TrainingFiltersBar'
import TrainingFormModal from '../components/training/TrainingFormModal'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { usersApi } from '../services/usersApi'
import {
  deleteTraining,
  fetchTrainings,
  openCreateTrainingForm,
  openEditTrainingForm,
  setTrainingFilters,
} from '../store/trainingsSlice'
import type { AppUser } from '../types/userList'
import type { Training } from '../types/training'
import { mapTrainingsToCalendar } from '../utils/trainingCalendar'
import { exportTrainingsToExcel, exportTrainingsToPdf } from '../utils/exportTrainingSkills'

export default function TrainingPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters } = useAppSelector((s) => s.trainings)
  const [users, setUsers] = useState<AppUser[]>([])
  const [view, setView] = useState<'list' | 'calendar'>('list')

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchTrainings(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    if (isManager) {
      usersApi.index().then((res) => setUsers(res.data.data))
    }
  }, [isManager])

  // Keep the employee list in sync with the signed-in user (adjust state
  // during render instead of setting it inside an effect).
  const [prevUsersKey, setPrevUsersKey] = useState(user)
  if (prevUsersKey !== user) {
    setPrevUsersKey(user)
    if (!isManager && user) {
      setUsers([{ id: user.id, name: user.name, email: user.email, role: user.role }])
    }
  }

  const upcoming = useMemo(
    () => items.filter((t) => t.status === 'scheduled'),
    [items],
  )
  const completed = useMemo(
    () => items.filter((t) => t.status === 'completed'),
    [items],
  )

  const fcEvents = useMemo(
    () => mapTrainingsToCalendar(items, isManager),
    [items, isManager],
  )

  const handleTrainingClick = (info: EventClickArg) => {
    const training = info.event.extendedProps.training as Training
    if (isManager) {
      dispatch(openEditTrainingForm(training))
    }
  }

  const renderCard = (training: Training) => (
    <article
      key={training.id}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{training.title}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            training.status === 'completed'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200'
          }`}
        >
          {t(`training.status.${training.status}`)}
        </span>
      </div>
      {training.description && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {training.description}
        </p>
      )}
      <dl className="mt-3 grid gap-1 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-slate-700 dark:text-slate-300">{t('training.trainer')}</dt>
          <dd>{training.trainer?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700 dark:text-slate-300">{t('training.dates')}</dt>
          <dd>
            {new Date(training.start_date).toLocaleString()} –{' '}
            {new Date(training.end_date).toLocaleString()}
          </dd>
        </div>
        {training.assignees && training.assignees.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="font-medium text-slate-700 dark:text-slate-300">
              {t('training.assignees')}
            </dt>
            <dd>{training.assignees.map((a) => a.name).join(', ')}</dd>
          </div>
        )}
      </dl>
      {isManager && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => dispatch(openEditTrainingForm(training))}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
          >
            {t('training.edit')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(deleteTraining(training.id))}
            className="text-sm font-medium text-red-600 dark:text-red-400"
          >
            {t('common.delete')}
          </button>
        </div>
      )}
    </article>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            {t('training.title')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('training.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportTrainingsToExcel(items)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('training.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportTrainingsToPdf(items, t('training.exportTitle'))}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('training.exportPdf')}
          </button>
          {isManager && (
            <button
              type="button"
              onClick={() => dispatch(openCreateTrainingForm())}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('training.assignTraining')}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6">
        <TrainingFiltersBar
          filters={filters}
          users={users}
          showEmployeeFilter={isManager}
          onChange={(f) => dispatch(setTrainingFilters(f))}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setView('list')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === 'list'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {t('training.viewList')}
        </button>
        <button
          type="button"
          onClick={() => setView('calendar')}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            view === 'calendar'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {t('training.viewCalendar')}
        </button>
      </div>

      {status === 'loading' ? (
        <p className="mt-8 text-center text-slate-500">{t('training.loading')}</p>
      ) : view === 'calendar' ? (
        <div className="calendar-theme mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listWeek',
            }}
            events={fcEvents}
            eventClick={handleTrainingClick}
            height="auto"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
              {t('training.upcoming')} ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">{t('training.noUpcoming')}</p>
            ) : (
              <div className="space-y-3">{upcoming.map(renderCard)}</div>
            )}
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
              {t('training.completed')} ({completed.length})
            </h2>
            {completed.length === 0 ? (
              <p className="text-sm text-slate-500">{t('training.noCompleted')}</p>
            ) : (
              <div className="space-y-3">{completed.map(renderCard)}</div>
            )}
          </section>
        </div>
      )}

      {isManager && <TrainingFormModal users={users} />}
    </div>
  )
}
