import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  authenticatedNavItems,
  filterNavItemsForRole,
  guestNavItems,
} from '../../config/navItems'
import { useAppSelector } from '../../hooks/redux'
import { IconChevronLeft } from './navIcons'
import SidebarLanguageSwitcher from './SidebarLanguageSwitcher'
import SidebarNavLink from './SidebarNavLink'
import SidebarProfile from './SidebarProfile'
import ThemeToggle from './ThemeToggle'
import SidebarBrand from './SidebarBrand'

const STORAGE_KEY = 'worksphere-sidebar-collapsed'

interface Props {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileClose }: Props) {
  const { t } = useTranslation()
  const { user, token } = useAppSelector((state) => state.auth)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  }, [collapsed])

  const navItems = token && user
    ? filterNavItemsForRole(authenticatedNavItems, user.role)
    : guestNavItems

  const sidebarContent = (
    <aside
      className={[
        'flex h-full flex-col bg-slate-900 text-slate-100 transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      ].join(' ')}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-700/80 px-3">
        <SidebarBrand collapsed={collapsed} onNavigate={onMobileClose} />
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:inline-flex"
          aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
        >
          <IconChevronLeft
            className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <div className="border-b border-slate-700/80 p-3">
        <SidebarLanguageSwitcher collapsed={collapsed} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <SidebarNavLink
            key={item.id}
            item={item}
            collapsed={collapsed}
            role={user?.role}
            onNavigate={onMobileClose}
          />
        ))}
      </nav>

      <div className="border-t border-slate-700/80 p-3">
        <div className={collapsed ? 'flex justify-center' : ''}>
          <ThemeToggle compact={collapsed} variant="sidebar" />
        </div>
      </div>

      {token && user && <SidebarProfile collapsed={collapsed} />}
    </aside>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 start-0 z-40 hidden lg:block">{sidebarContent}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label={t('nav.closeMenu')}
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={[
          'fixed inset-y-0 start-0 z-50 transform transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebarContent}
      </div>
    </>
  )
}
