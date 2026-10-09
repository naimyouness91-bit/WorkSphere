import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../hooks/redux'
import type { UserRole } from '../types/auth'
import { getDashboardPath } from '../utils/roles'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { t } = useTranslation()
  const { user, token, status } = useAppSelector((state) => state.auth)

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    return (
      <div className="px-4 py-12 text-center text-slate-600">
        {status === 'loading' ? t('common.loading') : t('common.redirecting')}
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />
  }

  return <Outlet />
}
