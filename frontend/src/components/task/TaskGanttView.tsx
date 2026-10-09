import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Task } from '../../types/task'

interface Props {
  tasks: Task[]
}

function parseDate(s: string): number {
  return new Date(s + 'T00:00:00').getTime()
}

export default function TaskGanttView({ tasks }: Props) {
  const { t } = useTranslation()
  const [now] = useState(() => Date.now())

  const { rangeStart, rangeEnd, rows } = useMemo(() => {
    const dated = tasks.filter((task) => task.due_date || task.project?.start_date)
    if (dated.length === 0) {
      return { rangeStart: now, rangeEnd: now + 86400000 * 30, rows: [] as Task[] }
    }

    let start = Infinity
    let end = -Infinity

    dated.forEach((task) => {
      const taskStart = task.project?.start_date
        ? parseDate(task.project.start_date)
        : task.due_date
          ? parseDate(task.due_date) - 86400000 * 3
          : now
      const taskEnd = task.due_date
        ? parseDate(task.due_date)
        : task.project?.end_date
          ? parseDate(task.project.end_date)
          : taskStart + 86400000 * 7
      start = Math.min(start, taskStart)
      end = Math.max(end, taskEnd)
    })

    return { rangeStart: start, rangeEnd: end + 86400000, rows: dated }
  }, [tasks, now])

  const span = rangeEnd - rangeStart || 1

  const barStyle = (task: Task) => {
    const taskStart = task.project?.start_date
      ? parseDate(task.project.start_date)
      : task.due_date
        ? parseDate(task.due_date) - 86400000 * 3
        : rangeStart
    const taskEnd = task.due_date
      ? parseDate(task.due_date)
      : task.project?.end_date
        ? parseDate(task.project.end_date)
        : taskStart + 86400000 * 7

    const left = ((taskStart - rangeStart) / span) * 100
    const width = Math.max(((taskEnd - taskStart) / span) * 100, 2)

    const color =
      task.status === 'done'
        ? 'bg-emerald-500'
        : task.is_overdue
          ? 'bg-red-500'
          : task.status === 'in_progress'
            ? 'bg-amber-500'
            : 'bg-slate-400'

    return { left: `${left}%`, width: `${width}%`, color }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-600">
        {t('tasks.ganttEmpty')}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[200px_1fr] border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="px-4 py-2">{t('tasks.titleField')}</div>
          <div className="px-4 py-2">{t('tasks.ganttTimeline')}</div>
        </div>
        {rows.map((task) => {
          const style = barStyle(task)
          return (
            <div
              key={task.id}
              className="grid grid-cols-[200px_1fr] border-b border-slate-100 dark:border-slate-800"
            >
              <div className="px-4 py-3">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {task.title}
                </p>
                <p className="truncate text-xs text-slate-500">{task.project?.title}</p>
              </div>
              <div className="relative flex items-center px-4 py-3">
                <div className="relative h-6 w-full rounded bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`absolute top-0 h-6 rounded ${style.color} opacity-90`}
                    style={{ left: style.left, width: style.width }}
                    title={`${task.due_date ?? ''} · ${t(`tasks.status.${task.status}`)}`}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
