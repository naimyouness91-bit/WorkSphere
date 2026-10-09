import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import NotificationDropdown from '../NotificationDropdown'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { logout } from '../../store/authSlice'
import { getRoleLabel } from '../../utils/roles'

interface Props {
  collapsed: boolean
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function SidebarProfile({ collapsed }: Props) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, token } = useAppSelector((state) => state.auth)

  if (!token || !user) {
    return null
  }

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="space-y-2 border-t border-slate-700/80 p-3">
      <NotificationDropdown variant="sidebar" collapsed={collapsed} />

      <div
        className={`flex items-center gap-3 rounded-lg bg-slate-800/60 p-2 ${collapsed ? 'justify-center' : ''}`}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white"
          title={user.name}
        >
          {getInitials(user.name)}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{getRoleLabel(user.role)}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        title={collapsed ? t('common.logOut') : undefined}
        className={`flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white ${collapsed ? 'px-2' : ''}`}
      >
        <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        {!collapsed && <span>{t('common.logOut')}</span>}
      </button>
    </div>
  )
}
