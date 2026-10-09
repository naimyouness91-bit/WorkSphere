import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DashboardShell from '../../components/DashboardShell'
import { dashboardApi } from '../../services/api'
import type { EmployeeDashboardData } from '../../types/auth'

export default function EmployeeDashboard() {
  const { t } = useTranslation()
  const [data, setData] = useState<EmployeeDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dashboardApi
      .employee()
      .then((res) => setData(res.data))
      .catch(() => setError(t('dashboard.loadEmployeeFailed')))
  }, [t])

  return (
    <DashboardShell
      title={t('dashboard.employeeTitle')}
      description={t('dashboard.employeeWelcome')}
      accentClass="bg-emerald-100 text-emerald-800"
    >
      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">{t('dashboard.myTasks')}</h2>
        {data?.tasks.length ? (
          <ul className="mt-4 space-y-3">
            {data.tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <p className="text-slate-500">{task.assignee}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {task.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-red-600">
            {error ?? t('dashboard.loadingTasks')}
          </p>
        )}
      </section>
    </DashboardShell>
  )
}
