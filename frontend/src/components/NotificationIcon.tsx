import type { NotificationType } from '../types/notification'

const iconPaths: Record<NotificationType, string> = {
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
}

const colors: Record<NotificationType, string> = {
  info: 'text-blue-600 bg-blue-100',
  success: 'text-emerald-600 bg-emerald-100',
  error: 'text-red-600 bg-red-100',
}

interface NotificationIconProps {
  type: NotificationType
  size?: 'sm' | 'md'
}

export default function NotificationIcon({ type, size = 'sm' }: NotificationIconProps) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${sizeClass} ${colors[type]}`}
    >
      <svg
        className={iconSize}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[type]} />
      </svg>
    </span>
  )
}
