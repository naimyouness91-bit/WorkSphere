import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  fetchNotifications,
  markAllNotificationsRead,
} from '../store/notificationSlice'
import NotificationIcon from './NotificationIcon'

interface NotificationDropdownProps {
  variant?: 'header' | 'sidebar'
  collapsed?: boolean
}

export default function NotificationDropdown({ variant = 'header', collapsed = false }: NotificationDropdownProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { items, unreadCount, status } = useAppSelector((state) => state.notifications)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsRead())
  }

  const isSidebar = variant === 'sidebar'

  return (
    <div className={`relative ${isSidebar ? 'w-full' : ''}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          isSidebar
            ? `relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white ${collapsed ? 'justify-center px-2' : ''}`
            : 'relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800'
        }
        aria-label={t('notifications.title')}
        title={collapsed ? t('notifications.title') : undefined}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            className={`flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ${
              isSidebar && !collapsed ? 'ms-auto' : 'absolute -right-0.5 -top-0.5'
            }`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {isSidebar && !collapsed && (
          <span className="truncate">{t('notifications.title')}</span>
        )}
      </button>

      {open && (
        <div
          className={`absolute z-50 w-80 overflow-hidden rounded-xl border shadow-lg sm:w-96 ${
            isSidebar
              ? 'bottom-full start-0 mb-2 border-slate-600 bg-slate-800'
              : 'end-0 mt-2 border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              isSidebar ? 'border-slate-700' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            <h3
              className={`text-sm font-semibold ${isSidebar ? 'text-slate-100' : 'text-slate-900 dark:text-slate-100'}`}
            >
              {t('notifications.title')}
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className={`text-xs font-medium ${isSidebar ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {status === 'loading' ? (
              <p className={`px-4 py-8 text-center text-sm ${isSidebar ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('common.loading')}
              </p>
            ) : items.length === 0 ? (
              <p className={`px-4 py-8 text-center text-sm ${isSidebar ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('notifications.empty')}
              </p>
            ) : (
              <ul className={`divide-y ${isSidebar ? 'divide-slate-700' : 'divide-slate-100 dark:divide-slate-800'}`}>
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 ${
                      !n.read_status
                        ? isSidebar
                          ? 'bg-indigo-900/40'
                          : 'bg-indigo-50/50 dark:bg-indigo-950/30'
                        : ''
                    }`}
                  >
                    <NotificationIcon type={n.type} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${isSidebar ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>
                        {n.message}
                      </p>
                      <p className={`mt-0.5 text-xs ${isSidebar ? 'text-slate-500' : 'text-slate-400'}`}>
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
