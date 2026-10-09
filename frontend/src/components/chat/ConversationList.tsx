import { useTranslation } from 'react-i18next'
import type { Conversation } from '../../types/chat'

interface Props {
  conversations: Conversation[]
  activeId: number | null
  currentUserId: number
  onSelect: (id: number) => void
  onNewDirect: () => void
  onNewGroup: () => void
}

function avatarInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
  onNewDirect,
  onNewGroup,
}: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col border-e border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('chat.title')}</h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onNewGroup}
            title={t('chat.newGroup')}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            👥
          </button>
          <button
            type="button"
            onClick={onNewDirect}
            title={t('chat.newChat')}
            className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700"
          >
            +
          </button>
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const title =
            conv.type === 'group'
              ? conv.name
              : conv.participants?.find((p) => p.id !== currentUserId)?.name ?? conv.name
          const preview = conv.last_message?.content
            ?? (conv.last_message?.attachment ? t('chat.attachment') : t('chat.noMessages'))
          return (
            <li key={conv.id}>
              <button
                type="button"
                onClick={() => onSelect(conv.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                  activeId === conv.id ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {avatarInitials(title ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-slate-900 dark:text-slate-100">{title}</span>
                    {conv.unread_count > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                        {conv.unread_count > 9 ? '9+' : conv.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{preview}</p>
                </div>
              </button>
            </li>
          )
        })}
        {conversations.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">{t('chat.noConversations')}</p>
        )}
      </ul>
    </div>
  )
}
