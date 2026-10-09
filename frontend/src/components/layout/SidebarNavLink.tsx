import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { NavItemConfig } from '../../config/navItems'
import { getDashboardPath } from '../../utils/roles'
import type { UserRole } from '../../types/auth'

interface Props {
  item: NavItemConfig
  collapsed: boolean
  role?: UserRole
  onNavigate?: () => void
}

function isItemActive(pathname: string, item: NavItemConfig): boolean {
  if (item.useDashboardPath) {
    return pathname.startsWith('/dashboard')
  }
  if (!item.path) return false
  if (item.path === '/') return pathname === '/'
  return pathname === item.path || pathname.startsWith(`${item.path}/`)
}

export default function SidebarNavLink({ item, collapsed, role, onNavigate }: Props) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const to = item.useDashboardPath && role ? getDashboardPath(role) : (item.path ?? '/')
  const active = isItemActive(pathname, item)

  return (
    <NavLink
      to={to}
      end={item.path === '/'}
      title={collapsed ? t(item.labelKey) : undefined}
      onClick={onNavigate}
      className={[
        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/30'
          : 'text-slate-300 hover:translate-x-0.5 hover:bg-slate-800 hover:text-white',
        collapsed ? 'justify-center px-2' : '',
      ].join(' ')}
    >
      <item.icon
        className={`h-5 w-5 shrink-0 ${
          active
            ? 'text-white'
            : 'text-slate-400 group-hover:text-slate-200'
        }`}
      />
      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
    </NavLink>
  )
}
