import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { chatApi } from '../../services/chatApi'
import { helpdeskApi } from '../../services/helpdeskApi'
import type { ChatMessage } from '../../types/chat'
import type { Ticket } from '../../types/ticket'

interface Props {
  ticket: Ticket
  onTicketUpdate: (ticket: Ticket) => void
}

export default function LiveSupportChat({ ticket, onTicketUpdate }: Props) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const conversationId = ticket.conversation_id

  // Re-show the loading spinner whenever the conversation moves to a new
  // thread (adjust state during render instead of setting it in an effect).
  const [prevConv, setPrevConv] = useState(conversationId)
  if (prevConv !== conversationId) {
    setPrevConv(conversationId)
    setLoading(true)
  }

  useEffect(() => {
    if (!conversationId) return
    chatApi
      .listMessages(conversationId)
      .then((res) => setMessages(res.data.data))
      .finally(() => setLoading(false))
  }, [conversationId])

  const startChat = async () => {
    setLoading(true)
    try {
      const { data } = await helpdeskApi.startChat(ticket.id)
      onTicketUpdate(data.data)
    } finally {
      setLoading(false)
    }
  }

  const send = async () => {
    if (!conversationId || !text.trim()) return
    setSending(true)
    const fd = new FormData()
    fd.append('content', text.trim())
    try {
      const { data } = await chatApi.sendMessage(conversationId, fd)
      setMessages((m) => [...m, data.data])
      setText('')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-xl border border-teal-200/60 bg-teal-50/20 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-teal-900 dark:text-teal-200">{t('helpdesk.liveChat')}</h3>
        {conversationId && (
          <Link to="/chat" className="text-xs font-medium text-teal-700 dark:text-teal-400">
            {t('helpdesk.openFullChat')}
          </Link>
        )}
      </div>

      {!conversationId ? (
        <button
          type="button"
          onClick={() => void startChat()}
          disabled={loading}
          className="mt-3 w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {t('helpdesk.startLiveChat')}
        </button>
      ) : (
        <>
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-teal-100 bg-white p-2 dark:border-teal-900 dark:bg-slate-900">
            {loading && <p className="text-xs text-slate-500">{t('common.loading')}</p>}
            {messages.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="font-medium text-teal-800 dark:text-teal-300">{m.sender?.name}: </span>
                <span className="text-slate-700 dark:text-slate-300">{m.content}</span>
              </div>
            ))}
            {!loading && messages.length === 0 && (
              <p className="text-xs text-slate-500">{t('helpdesk.noMessages')}</p>
            )}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void send()}
              placeholder={t('helpdesk.chatPlaceholder')}
              className="flex-1 rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !text.trim()}
              className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              {t('helpdesk.send')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
