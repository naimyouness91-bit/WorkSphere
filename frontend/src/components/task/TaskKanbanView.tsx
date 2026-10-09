import { useTranslation } from 'react-i18next'
import type { Task, TaskStatus } from '../../types/task'

const COLUMNS: TaskStatus[] = ['pending', 'in_progress', 'done']

interface Props {
  tasks: Task[]
  isManager: boolean
  onStatusChange: (task: Task, status: TaskStatus) => void
  onComplete: (task: Task) => void
  onEdit: (task: Task) => void
}

export default function TaskKanbanView({
  tasks,
  isManager,
  onStatusChange,
  onComplete,
  onEdit,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((task) => task.status === col)
        return (
          <div
            key={col}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40"
          >
            <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t(`tasks.status.${col}`)}
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700">
                {columnTasks.length}
              </span>
            </h3>
            <ul className="space-y-2">
              {columnTasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  <p className="font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{task.project?.title}</p>
                  {task.due_date && (
                    <p
                      className={`mt-1 text-xs ${task.is_overdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}
                    >
                      {t('tasks.dueDate')}: {task.due_date}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.status !== 'done' && (
                      <button
                        type="button"
                        onClick={() => onComplete(task)}
                        className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        {t('tasks.markDone')}
                      </button>
                    )}
                    {isManager && (
                      <>
                        {col !== 'pending' && (
                          <button
                            type="button"
                            onClick={() =>
                              onStatusChange(
                                task,
                                col === 'done' ? 'in_progress' : 'pending',
                              )
                            }
                            className="rounded border px-2 py-1 text-xs dark:border-slate-500"
                          >
                            {t('tasks.moveBack')}
                          </button>
                        )}
                        {col !== 'done' && (
                          <button
                            type="button"
                            onClick={() =>
                              onStatusChange(
                                task,
                                col === 'pending' ? 'in_progress' : 'done',
                              )
                            }
                            className="rounded border px-2 py-1 text-xs dark:border-slate-500"
                          >
                            {t('tasks.moveForward')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit(task)}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
                        >
                          {t('tasks.edit')}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
              {columnTasks.length === 0 && (
                <p className="py-4 text-center text-xs text-slate-400">{t('tasks.emptyColumn')}</p>
              )}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
