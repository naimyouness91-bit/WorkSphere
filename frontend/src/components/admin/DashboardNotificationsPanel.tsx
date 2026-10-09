import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../store/notificationSlice'
import NotificationIcon from '../NotificationIcon'

export default function DashboardNotificationsPanel() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { items, unreadCount, status } = useAppSelector((state) => state.notifications)

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  const unread = items.filter((n) => !n.read_status).slice(0, 8)

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t('adminDashboard.notifications')}
          {unreadCount > 0 && (
            <span className="ms-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => dispatch(markAllNotificationsRead())}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>
      <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
        {status === 'loading' ? (
          <p className="text-sm text-slate-500">{t('common.loading')}</p>
        ) : unread.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('notifications.empty')}
          </p>
        ) : (
          unread.map((n) => (
            <div
              key={n.id}
              className="flex gap-3 rounded-lg border border-slate-100 bg-indigo-50/40 p-3 dark:border-slate-600 dark:bg-indigo-950/30"
            >
              <NotificationIcon type={n.type} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 dark:text-slate-200">{n.message}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => dispatch(markNotificationRead(n.id))}
                  className="mt-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {t('adminDashboard.markRead')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
