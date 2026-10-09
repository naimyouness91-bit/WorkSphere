import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectBoard } from '../../types/projectManagement'
import { KANBAN_COLUMNS } from '../../types/projectManagement'
import type { Task, TaskStatus } from '../../types/task'

interface KanbanBoardProps {
  board: ProjectBoard
  onStatusChange: (taskId: number, status: TaskStatus) => void
  canEdit: boolean
}

export default function KanbanBoard({ board, onStatusChange, canEdit }: KanbanBoardProps) {
  const { t } = useTranslation()
  const [draggingId, setDraggingId] = useState<number | null>(null)

  const columns: Record<TaskStatus, Task[]> = {
    pending: board.pending,
    in_progress: board.in_progress,
    done: board.done,
  }

  const handleDrop = (status: TaskStatus) => {
    if (draggingId !== null && canEdit) {
      onStatusChange(draggingId, status)
    }
    setDraggingId(null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col.id}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(col.id)}
          className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t(col.labelKey)}
            <span className="ml-2 text-slate-400">({columns[col.id].length})</span>
          </h3>
          <ul className="space-y-2 min-h-[120px]">
            {columns[col.id].map((task) => (
              <li
                key={task.id}
                draggable={canEdit}
                onDragStart={() => setDraggingId(task.id)}
                onDragEnd={() => setDraggingId(null)}
                className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-slate-600 dark:bg-slate-800 ${
                  draggingId === task.id ? 'opacity-50' : ''
                }`}
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">{task.title}</p>
                {task.assignee && (
                  <p className="mt-1 text-xs text-slate-500">{task.assignee.name}</p>
                )}
                {task.due_date && (
                  <p className={`mt-1 text-xs ${task.is_overdue ? 'text-red-600' : 'text-slate-400'}`}>
                    {task.due_date}
                  </p>
                )}
                {task.dependencies && task.dependencies.length > 0 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {t('projectMgmt.dependsOn', { count: task.dependencies.length })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
