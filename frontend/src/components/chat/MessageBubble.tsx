import { useTranslation } from 'react-i18next'
import type { ChatMessage } from '../../types/chat'

interface Props {
  message: ChatMessage
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: Props) {
  const { t } = useTranslation()

  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  const readLabel =
    message.status === 'read'
      ? t('chat.read')
      : message.status === 'delivered'
        ? t('chat.delivered')
        : t('chat.sent')

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm sm:max-w-[70%] ${
          isOwn
            ? 'rounded-ee-sm bg-indigo-600 text-white'
            : 'rounded-es-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100'
        }`}
      >
        {!isOwn && message.sender && (
          <p className="mb-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {message.sender.name}
          </p>
        )}
        {message.content && <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>}
        {message.attachment && (
          <div className="mt-2">
            {message.attachment.mime.startsWith('image/') ? (
              <a href={message.attachment.url} target="_blank" rel="noreferrer">
                <img
                  src={message.attachment.url}
                  alt={message.attachment.name}
                  className="max-h-48 rounded-lg"
                />
              </a>
            ) : (
              <a
                href={message.attachment.url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  isOwn ? 'border-indigo-400 text-indigo-100' : 'border-slate-200 dark:border-slate-600'
                }`}
              >
                <span>📄</span>
                <span className="truncate">{message.attachment.name}</span>
              </a>
            )}
          </div>
        )}
        <div
          className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
            isOwn ? 'text-indigo-200' : 'text-slate-400'
          }`}
        >
          <span>{time}</span>
          {isOwn && <span title={readLabel}>{message.status === 'read' ? '✓✓' : '✓'}</span>}
        </div>
      </div>
    </div>
  )
}
