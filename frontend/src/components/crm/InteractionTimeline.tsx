import { useTranslation } from 'react-i18next'
import type { CrmInteraction } from '../../types/crm'

const TYPE_ICONS: Record<string, string> = {
  call: '📞',
  meeting: '🤝',
  email: '✉️',
}

interface InteractionTimelineProps {
  interactions: CrmInteraction[]
}

export default function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  const { t } = useTranslation()

  if (interactions.length === 0) {
    return <p className="text-sm text-slate-500">{t('crm.noInteractions')}</p>
  }

  return (
    <ol className="relative border-s border-slate-200 dark:border-slate-700">
      {interactions.map((item) => (
        <li key={item.id} className="mb-6 ms-6">
          <span className="absolute -start-3 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-sm dark:bg-indigo-900">
            {TYPE_ICONS[item.type] ?? '•'}
          </span>
          <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t(`crm.interactionType.${item.type}`)}
                {item.source !== 'manual' && (
                  <span className="ml-2 text-xs font-normal text-indigo-500">({item.source})</span>
                )}
              </span>
              <time className="text-xs text-slate-500">
                {new Date(item.occurred_at).toLocaleString()}
              </time>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {item.client?.name ?? item.partner?.name}
              {item.client?.company ? ` · ${item.client.company}` : ''}
              {item.partner?.organization ? ` · ${item.partner.organization}` : ''}
            </p>
            {item.notes && (
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{item.notes}</p>
            )}
            {item.logger && (
              <p className="mt-1 text-xs text-slate-400">
                {t('crm.loggedBy', { name: item.logger.name })}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
