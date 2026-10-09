import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import GanttChart from '../components/project/GanttChart'
import KanbanBoard from '../components/project/KanbanBoard'
import MilestoneTimeline from '../components/project/MilestoneTimeline'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppSelector } from '../hooks/redux'
import { api } from '../services/api'
import { projectManagementApi } from '../services/projectManagementApi'
import { exportPlanToExcel, exportPlanToPdf } from '../utils/exportProjectPlan'
import type { ProjectOverview } from '../types/projectManagement'
import type { TaskStatus } from '../types/task'

type Tab = 'kanban' | 'milestones' | 'gantt' | 'history'

export default function ProjectDetailPage() {
  const { t } = useTranslation()
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAppSelector((s) => s.auth)
  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const [data, setData] = useState<ProjectOverview | null>(null)
  const [historyEntries, setHistoryEntries] = useState<
    Awaited<ReturnType<typeof projectManagementApi.history>>['data']['data']
  >([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('kanban')
  const [employees, setEmployees] = useState<Array<{ id: number; name: string }>>([])

  const [showTask, setShowTask] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
  })
  const [milestoneForm, setMilestoneForm] = useState({ title: '', target_date: '' })

  const load = useCallback(() => {
    if (!projectId) return
    projectManagementApi
      .overview(Number(projectId))
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!canManage) return
    api.get<{ data: Array<{ id: number; name: string; role: string }> }>('/users').then((res) => {
      setEmployees(res.data.data.filter((u) => u.role === 'employee').map((u) => ({ id: u.id, name: u.name })))
    })
  }, [canManage])

  useEffect(() => {
    if (tab === 'history' && projectId) {
      projectManagementApi.history(Number(projectId)).then((res) => setHistoryEntries(res.data.data))
    }
  }, [tab, projectId])

  const handleStatusChange = async (taskId: number, status: TaskStatus) => {
    await projectManagementApi.updateTaskStatus(taskId, status)
    load()
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    await projectManagementApi.addTask({
      project_id: Number(projectId),
      title: taskForm.title,
      description: taskForm.description || null,
      assigned_to: taskForm.assigned_to ? Number(taskForm.assigned_to) : null,
      due_date: taskForm.due_date || null,
    })
    setShowTask(false)
    setTaskForm({ title: '', description: '', assigned_to: '', due_date: '' })
    load()
  }

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    await projectManagementApi.addMilestone(Number(projectId), milestoneForm)
    setShowMilestone(false)
    setMilestoneForm({ title: '', target_date: '' })
    load()
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!projectId) return
    const res = await projectManagementApi.exportPlan(Number(projectId))
    const plan = res.data.data as unknown as Parameters<typeof exportPlanToExcel>[0]
    if (format === 'excel') exportPlanToExcel(plan)
    else exportPlanToPdf(plan, data?.project.title ?? 'Project Plan')
  }

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <LoadingSpinner label={t('projectMgmt.loading')} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center text-red-600">
        {t('projectMgmt.loadFailed')}
      </div>
    )
  }

  const allTasks = [...data.board.pending, ...data.board.in_progress, ...data.board.done]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'kanban', label: t('projectMgmt.tabs.kanban') },
    { id: 'milestones', label: t('projectMgmt.tabs.milestones') },
    { id: 'gantt', label: t('projectMgmt.tabs.gantt') },
    { id: 'history', label: t('projectMgmt.tabs.history') },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/projects" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
        ← {t('projectMgmt.backToProjects')}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{data.project.title}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {data.project.start_date} → {data.project.end_date} · {data.project.progress_percent}%
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setShowTask(true)}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white"
              >
                {t('projectMgmt.addTask')}
              </button>
              <button
                type="button"
                onClick={() => setShowMilestone(true)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600"
              >
                {t('projectMgmt.addMilestone')}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => handleExport('excel')}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600"
          >
            {t('projectMgmt.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600"
          >
            {t('projectMgmt.exportPdf')}
          </button>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === item.id
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'kanban' && (
          <KanbanBoard
            board={data.board}
            onStatusChange={handleStatusChange}
            canEdit={canManage || user?.role === 'employee'}
          />
        )}
        {tab === 'milestones' && <MilestoneTimeline milestones={data.milestones} />}
        {tab === 'gantt' && (
          <GanttChart project={data.project} tasks={allTasks} milestones={data.milestones} />
        )}
        {tab === 'history' && (
          <ul className="space-y-2 text-sm">
            {historyEntries.map((h) => (
              <li
                key={h.id}
                className="rounded-lg border border-slate-200 px-4 py-2 dark:border-slate-700"
              >
                <p className="text-slate-800 dark:text-slate-200">{h.description}</p>
                <p className="text-xs text-slate-500">
                  {h.user_name ?? '—'} · {h.created_at ? new Date(h.created_at).toLocaleString() : ''}
                </p>
              </li>
            ))}
            {historyEntries.length === 0 && (
              <p className="text-slate-500">{t('projectMgmt.noHistory')}</p>
            )}
          </ul>
        )}
      </div>

      {showTask && (
        <Modal title={t('projectMgmt.addTask')} onClose={() => setShowTask(false)}>
          <form onSubmit={handleAddTask} className="space-y-3">
            <input
              required
              placeholder={t('projectMgmt.taskTitle')}
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900"
            />
            <select
              value={taskForm.assigned_to}
              onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900"
            >
              <option value="">{t('projectMgmt.unassigned')}</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={taskForm.due_date}
              onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900"
            />
            <button type="submit" className="w-full rounded bg-indigo-600 py-2 text-sm text-white">
              {t('common.save')}
            </button>
          </form>
        </Modal>
      )}

      {showMilestone && (
        <Modal title={t('projectMgmt.addMilestone')} onClose={() => setShowMilestone(false)}>
          <form onSubmit={handleAddMilestone} className="space-y-3">
            <input
              required
              placeholder={t('projectMgmt.milestoneTitle')}
              value={milestoneForm.title}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900"
            />
            <input
              type="date"
              required
              value={milestoneForm.target_date}
              onChange={(e) => setMilestoneForm({ ...milestoneForm, target_date: e.target.value })}
              className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-900"
            />
            <button type="submit" className="w-full rounded bg-indigo-600 py-2 text-sm text-white">
              {t('common.save')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <div className="mb-4 flex justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-500">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
