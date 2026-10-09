import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { assistantApi } from '../../services/assistantApi'
import type { ChatMessage } from '../../types/assistant'
import VoiceInputButton from './VoiceInputButton'
import ChatQuickActions from './ChatQuickActions'

interface Props {
  greeting?: string
  initialHistory?: ChatMessage[]
  compact?: boolean
}

export default function AssistantChat({ greeting, initialHistory = [], compact }: Props) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [displayGreeting, setDisplayGreeting] = useState(greeting ?? '')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setLoading(true)

    try {
      const res = await assistantApi.chat(trimmed)
      setDisplayGreeting(res.data.data.greeting)
      setMessages(res.data.data.history)
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('assistant.chatError') },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${compact ? 'h-[420px]' : 'min-h-[480px]'}`}
    >
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {displayGreeting && messages.length === 0 && (
          <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3 text-sm text-indigo-900 dark:from-indigo-950/50 dark:to-violet-950/50 dark:text-indigo-100">
            {displayGreeting}
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}`}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={[
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
              ].join(' ')}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-700">
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatQuickActions />

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
        <VoiceInputButton onTranscript={send} disabled={loading} />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('assistant.inputPlaceholder')}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {t('assistant.send')}
        </button>
      </form>
    </div>
  )
}
