import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TaskFiltersBar from '../components/task/TaskFiltersBar'
import TaskFormModal from '../components/task/TaskFormModal'
import TaskKanbanView from '../components/task/TaskKanbanView'
import TaskGanttView from '../components/task/TaskGanttView'
import KpiCard from '../components/KpiCard'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { usersApi } from '../services/usersApi'
import { fetchProjects } from '../store/projectsSlice'
import {
  completeTask,
  deleteTask,
  fetchTasks,
  openCreateTaskForm,
  openEditTaskForm,
  setTaskFilters,
  updateTask,
} from '../store/tasksSlice'
import type { AppUser } from '../types/userList'
import type { Task, TaskStatus, TaskViewMode } from '../types/task'
import { emptyProjectFilters } from '../types/project'
import { exportTasksToExcel, exportTasksToPdf } from '../utils/exportProjectsTasks'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
}

export default function TasksPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters } = useAppSelector((s) => s.tasks)
  const { items: projects } = useAppSelector((s) => s.projects)
  const [users, setUsers] = useState<AppUser[]>([])
  const [viewMode, setViewMode] = useState<TaskViewMode>('table')

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchTasks(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    dispatch(fetchProjects(emptyProjectFilters()))
  }, [dispatch])

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

  const completedCount = items.filter((task) => task.status === 'done').length
  const overdueCount = items.filter((task) => task.is_overdue).length

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    dispatch(updateTask({ id: task.id, data: { status: newStatus } }))
  }

  const handleComplete = (task: Task) => {
    if (task.status === 'done') return
    dispatch(completeTask(task.id))
  }

  const handleDelete = (task: Task) => {
    if (window.confirm(t('tasks.confirmDelete'))) {
      dispatch(deleteTask(task.id))
    }
  }

  const viewButtonClass = (mode: TaskViewMode) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      viewMode === mode
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }`

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('tasks.title')}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {isManager ? t('tasks.subtitleManager') : t('tasks.subtitleEmployee')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportTasksToExcel(items)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('tasks.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportTasksToPdf(items, t('tasks.exportTitle'))}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('tasks.exportPdf')}
          </button>
          {isManager && (
            <button
              type="button"
              onClick={() => dispatch(openCreateTaskForm())}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('tasks.newTask')}
            </button>
          )}
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label={t('tasks.kpiTotal')} value={items.length} accent="indigo" />
        <KpiCard label={t('tasks.kpiCompleted')} value={completedCount} accent="emerald" />
        <KpiCard label={t('tasks.kpiOverdue')} value={overdueCount} accent="amber" />
      </section>

      <div className="mt-6">
        <TaskFiltersBar
          filters={filters}
          onChange={(f) => dispatch(setTaskFilters(f))}
          projects={projects}
          showAssigneeFilter={isManager}
          users={users}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={viewButtonClass('table')} onClick={() => setViewMode('table')}>
          {t('tasks.viewTable')}
        </button>
        <button type="button" className={viewButtonClass('kanban')} onClick={() => setViewMode('kanban')}>
          {t('tasks.viewKanban')}
        </button>
        <button type="button" className={viewButtonClass('gantt')} onClick={() => setViewMode('gantt')}>
          {t('tasks.viewGantt')}
        </button>
      </div>

      {status === 'loading' && (
        <p className="mt-8 text-center text-slate-500">{t('common.loading')}</p>
      )}

      {status !== 'loading' && viewMode === 'kanban' && (
        <div className="mt-6">
          <TaskKanbanView
            tasks={items}
            isManager={isManager}
            onStatusChange={handleStatusChange}
            onComplete={handleComplete}
            onEdit={(task) => dispatch(openEditTaskForm(task))}
          />
        </div>
      )}

      {status !== 'loading' && viewMode === 'gantt' && (
        <div className="mt-6">
          <TaskGanttView tasks={items} />
        </div>
      )}

      {status !== 'loading' && viewMode === 'table' && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('tasks.titleField')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('tasks.project')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('tasks.assignee')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('tasks.dueDate')}
                </th>
                <th className="px-4 py-3 text-start text-xs font-medium uppercase text-slate-500">
                  {t('tasks.statusLabel')}
                </th>
                <th className="px-4 py-3 text-end text-xs font-medium uppercase text-slate-500">
                  {t('tasks.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {items.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {task.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {task.project?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {task.assignee?.name ?? t('tasks.unassigned')}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm ${task.is_overdue ? 'font-medium text-red-600' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    {task.due_date ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status] ?? ''}`}
                    >
                      {t(`tasks.status.${task.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex flex-wrap justify-end gap-2">
                      {task.status !== 'done' && (
                        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleComplete(task)}
                            className="rounded border-slate-300"
                          />
                          {t('tasks.markDone')}
                        </label>
                      )}
                      {isManager && (
                        <>
                          <button
                            type="button"
                            onClick={() => dispatch(openEditTaskForm(task))}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
                          >
                            {t('tasks.edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(task)}
                            className="text-sm font-medium text-red-600 dark:text-red-400"
                          >
                            {t('common.delete')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-8 text-center text-slate-500">{t('tasks.empty')}</p>
          )}
        </div>
      )}

      {isManager && <TaskFormModal projects={projects} users={users} />}
    </div>
  )
}
