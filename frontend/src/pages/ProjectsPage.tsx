import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProjectFiltersBar from '../components/project/ProjectFiltersBar'
import ProjectFormModal from '../components/project/ProjectFormModal'
import KpiCard from '../components/KpiCard'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { usersApi } from '../services/usersApi'
import {
  deleteProject,
  fetchProjects,
  openCreateProjectForm,
  openEditProjectForm,
  setProjectFilters,
} from '../store/projectsSlice'
import type { AppUser } from '../types/userList'
import type { Project } from '../types/project'
import { exportProjectsToExcel, exportProjectsToPdf } from '../utils/exportProjectsTasks'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  completed: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  on_hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
}

export default function ProjectsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters } = useAppSelector((s) => s.projects)
  const [users, setUsers] = useState<AppUser[]>([])

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchProjects(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    if (isManager) {
      usersApi.index().then((res) => setUsers(res.data.data))
    }
  }, [isManager])

  const managers = useMemo(
    () => users.filter((u) => u.role === 'admin' || u.role === 'manager'),
    [users],
  )

  const activeCount = items.filter((p) => p.status === 'active').length
  const avgProgress =
    items.length > 0
      ? Math.round(items.reduce((sum, p) => sum + p.progress_percent, 0) / items.length)
      : 0

  const handleDelete = (project: Project) => {
    if (window.confirm(t('projects.confirmDelete'))) {
      dispatch(deleteProject(project.id))
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('projects.title')}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('projects.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportProjectsToExcel(items)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('projects.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportProjectsToPdf(items, t('projects.exportTitle'))}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('projects.exportPdf')}
          </button>
          {isManager && (
            <button
              type="button"
              onClick={() => dispatch(openCreateProjectForm())}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('projects.newProject')}
            </button>
          )}
        </div>
      </div>

      {isManager && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label={t('projects.kpiActive')} value={activeCount} accent="emerald" />
          <KpiCard label={t('projects.kpiTotal')} value={items.length} accent="indigo" />
          <KpiCard
            label={t('projects.kpiAvgProgress')}
            value={`${avgProgress}%`}
            accent="amber"
          />
        </section>
      )}

      <div className="mt-6">
        <ProjectFiltersBar
          filters={filters}
          onChange={(f) => dispatch(setProjectFilters(f))}
          showManagerFilter={isManager}
          managers={managers}
        />
      </div>

      {status === 'loading' && (
        <p className="mt-8 text-center text-slate-500">{t('common.loading')}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((project) => (
          <article
            key={project.id}
            className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                <Link to={`/projects/${project.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {project.title}
                </Link>
              </h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[project.status] ?? ''}`}
              >
                {t(`projects.status.${project.status}`)}
              </span>
            </div>
            {project.description && (
              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {project.description}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {t('projects.manager')}: {project.manager?.name ?? '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {project.start_date} → {project.end_date}
            </p>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{t('projects.progress')}</span>
                <span>{project.progress_percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all"
                  style={{ width: `${project.progress_percent}%` }}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Link
                to={`/projects/${project.id}`}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
              >
                {t('projectMgmt.openDashboard')}
              </Link>
              {isManager && (
                <>
                  <button
                    type="button"
                    onClick={() => dispatch(openEditProjectForm(project))}
                    className="text-sm font-medium text-indigo-600 dark:text-indigo-400"
                  >
                    {t('projects.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(project)}
                    className="text-sm font-medium text-red-600 dark:text-red-400"
                  >
                    {t('common.delete')}
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      {status === 'succeeded' && items.length === 0 && (
        <p className="mt-8 text-center text-slate-500">{t('projects.empty')}</p>
      )}

      {isManager && <ProjectFormModal managers={managers.length ? managers : users} />}
    </div>
  )
}
