import { useTranslation } from 'react-i18next'
import type { TicketUpdate } from '../../types/helpdesk'

const TYPE_ICONS: Record<TicketUpdate['type'], string> = {
  created: '🎫',
  comment: '💬',
  status_change: '🔄',
  assignment: '👤',
  escalation: '⚠️',
}

interface Props {
  updates: TicketUpdate[]
}

export default function TicketTimeline({ updates }: Props) {
  const { t } = useTranslation()

  if (updates.length === 0) {
    return <p className="text-sm text-slate-500">{t('helpdesk.noUpdates')}</p>
  }

  return (
    <ol className="relative space-y-4 border-s border-slate-200 ps-4 dark:border-slate-700">
      {updates.map((u) => (
        <li key={u.id} className="relative">
          <span className="absolute -start-[1.35rem] flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs dark:bg-slate-900">
            {TYPE_ICONS[u.type]}
          </span>
          <p className="text-sm text-slate-800 dark:text-slate-200">{u.message}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {u.user?.name ?? t('helpdesk.system')} · {u.created_at?.slice(0, 16).replace('T', ' ')}
          </p>
        </li>
      ))}
    </ol>
  )
}
