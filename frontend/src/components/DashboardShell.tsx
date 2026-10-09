import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { logout } from '../store/authSlice'
import { getRoleLabel } from '../utils/roles'

interface DashboardShellProps {
  title: string
  description: string
  accentClass: string
  children: ReactNode
}

export default function DashboardShell({
  title,
  description,
  accentClass,
  children,
}: DashboardShellProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user } = useAppSelector((state) => state.auth)

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/')
  }

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${accentClass}`}
          >
            {getRoleLabel(user.role)}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{title}</h1>
          <p className="mt-2 text-slate-600">{description}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {t('common.logOut')}
        </button>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">{t('dashboard.profile')}</h2>
        <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">{t('dashboard.profileName')}</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">{t('dashboard.profileEmail')}</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">{t('dashboard.profileRole')}</dt>
            <dd>{getRoleLabel(user.role)}</dd>
          </div>
        </dl>
      </section>

      {children}
    </div>
  )
}
