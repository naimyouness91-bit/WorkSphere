import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './layout/Sidebar'
import AppHeader from './layout/AppHeader'
import AssistantWidget from './assistant/AssistantWidget'
import { IconMenu } from './layout/navIcons'
import { useAppSelector } from '../hooks/redux'
import OfflineBanner from './offline/OfflineBanner'
import SyncStatusPanel from './offline/SyncStatusPanel'

const STORAGE_KEY = 'worksphere-sidebar-collapsed'

export default function Layout() {
  const { token } = useAppSelector((state) => state.auth)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const mainOffset = collapsed ? 'lg:ps-[4.5rem]' : 'lg:ps-64'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`flex min-h-screen flex-col transition-[padding] duration-300 ease-in-out ${mainOffset}`}>
        <AppHeader
          showMenuButton
          onMenuOpen={() => setMobileOpen(true)}
          menuIcon={<IconMenu className="h-6 w-6" />}
        />

        {token && <OfflineBanner />}

        <main className="flex-1">
          {token && (
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/50 lg:hidden">
              <SyncStatusPanel compact />
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {token && <AssistantWidget />}
    </div>
  )
}
