import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppSelector } from '../../hooks/redux'
import { assistantApi } from '../../services/assistantApi'
import type { AssistantSuggestion } from '../../types/assistant'
import AssistantChat from './AssistantChat'
import SuggestionCards from './SuggestionCards'

export default function AssistantWidget() {
  const { t } = useTranslation()
  const { token } = useAppSelector((state) => state.auth)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'chat' | 'suggestions'>('chat')
  const [greeting, setGreeting] = useState('')
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  // Show the loader whenever the widget is opened (adjust state during render
  // instead of setting it inside an effect).
  const [prevOpen, setPrevOpen] = useState(open)
  if (prevOpen !== open) {
    setPrevOpen(open)
    if (open && token) {
      setLoading(true)
    }
  }

  useEffect(() => {
    if (!token || !open) return
    assistantApi
      .suggest()
      .then((res) => {
        setGreeting(res.data.data.greeting)
        setSuggestions(res.data.data.suggestions)
      })
      .finally(() => setLoading(false))
  }, [token, open])

  if (!token) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/40 transition-all duration-200 hover:scale-105 hover:shadow-xl"
        aria-label={t('assistant.open')}
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-24 end-6 z-50 flex w-[min(100vw-2rem,400px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 dark:border-slate-700">
            <div>
              <p className="font-semibold text-white">{t('assistant.title')}</p>
              <p className="text-xs text-indigo-100">{t('assistant.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/assistant"
                className="rounded-lg bg-white/20 px-2 py-1 text-xs text-white hover:bg-white/30"
                onClick={() => setOpen(false)}
              >
                {t('assistant.expand')}
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-white hover:bg-white/20"
                aria-label={t('assistant.close')}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {(['chat', 'suggestions'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={[
                  'flex-1 py-2.5 text-sm font-medium transition',
                  tab === key
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400',
                ].join(' ')}
              >
                {t(`assistant.tabs.${key}`)}
              </button>
            ))}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-3">
            {tab === 'chat' ? (
              <AssistantChat greeting={greeting} compact />
            ) : loading ? (
              <p className="py-8 text-center text-sm text-slate-500">{t('assistant.loading')}</p>
            ) : (
              <SuggestionCards suggestions={suggestions} />
            )}
          </div>
        </div>
      )}
    </>
  )
}
