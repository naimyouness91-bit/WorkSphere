import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Project } from '../../types/project'
import type { Task } from '../../types/task'
import type { Milestone } from '../../types/projectManagement'

interface GanttChartProps {
  project: Project
  tasks: Task[]
  milestones: Milestone[]
}

function parseDate(s: string): number {
  return new Date(s).getTime()
}

export default function GanttChart({ project, tasks, milestones }: GanttChartProps) {
  const { t } = useTranslation()

  const { start, end, range } = useMemo(() => {
    const start = parseDate(project.start_date)
    const end = parseDate(project.end_date)
    const range = Math.max(end - start, 1)

    return { start, end, range }
  }, [project])

  const barLeft = (dateStr: string | null) => {
    if (!dateStr) return 0
    const d = parseDate(dateStr)
    return Math.max(0, Math.min(100, ((d - start) / range) * 100))
  }

  const barWidth = (from: string | null, to: string | null) => {
    const a = from ? parseDate(from) : start
    const b = to ? parseDate(to) : end
    return Math.max(2, Math.min(100, ((b - a) / range) * 100))
  }

  const rows = [
    ...tasks.map((task) => ({
      id: `t-${task.id}`,
      label: task.title,
      color:
        task.status === 'done'
          ? 'bg-emerald-500'
          : task.status === 'in_progress'
            ? 'bg-amber-500'
            : 'bg-slate-400',
      left: barLeft(task.due_date ?? project.start_date),
      width: barWidth(project.start_date, task.due_date ?? project.end_date),
    })),
    ...milestones.map((m) => ({
      id: `m-${m.id}`,
      label: `◆ ${m.title}`,
      color: 'bg-indigo-600',
      left: barLeft(m.target_date),
      width: 1.5,
    })),
  ]

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex justify-between text-xs text-slate-500">
        <span>{project.start_date}</span>
        <span>{t('projectMgmt.ganttTitle')}</span>
        <span>{project.end_date}</span>
      </div>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">{t('projectMgmt.ganttEmpty')}</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-xs text-slate-700 dark:text-slate-300">
                {row.label}
              </span>
              <div className="relative h-6 flex-1 rounded bg-slate-100 dark:bg-slate-900">
                <div
                  className={`absolute top-1 h-4 rounded ${row.color}`}
                  style={{ left: `${row.left}%`, width: `${row.width}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
