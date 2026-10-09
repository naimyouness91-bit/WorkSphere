import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { removeToast } from '../store/notificationSlice'
import NotificationIcon from './NotificationIcon'

const borderStyles = {
  info: 'border-blue-200 bg-blue-50',
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-red-200 bg-red-50',
}

export default function NotificationToast() {
  const dispatch = useAppDispatch()
  const toasts = useAppSelector((state) => state.notifications.toasts)

  useEffect(() => {
    if (toasts.length === 0) return

    const timers = toasts.map((item) =>
      setTimeout(() => {
        dispatch(removeToast(item.id))
      }, 5000),
    )

    return () => timers.forEach(clearTimeout)
  }, [dispatch, toasts])

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((item) => (
        <div
          key={item.id}
          role="alert"
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${borderStyles[item.type]}`}
        >
          <NotificationIcon type={item.type} />
          <span className="flex-1 text-slate-800">{item.message}</span>
          <button
            type="button"
            onClick={() => dispatch(removeToast(item.id))}
            className="shrink-0 text-slate-500 hover:text-slate-800"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
