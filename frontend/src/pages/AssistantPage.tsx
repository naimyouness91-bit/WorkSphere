import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AssistantChat from '../components/assistant/AssistantChat'
import SuggestionCards from '../components/assistant/SuggestionCards'
import LoadingSpinner from '../components/LoadingSpinner'
import { assistantApi } from '../services/assistantApi'
import type { AssistantSuggestion } from '../types/assistant'

export default function AssistantPage() {
  const { t } = useTranslation()
  const [greeting, setGreeting] = useState('')
  const [summary, setSummary] = useState('')
  const [suggestions, setSuggestions] = useState<AssistantSuggestion[]>([])
  const [aiToday, setAiToday] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    assistantApi
      .suggest()
      .then((res) => {
        setGreeting(res.data.data.greeting)
        setSummary(res.data.data.summary ?? '')
        setSuggestions(res.data.data.suggestions)
        setAiToday(res.data.data.ai_suggestions_today)
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('assistant.title')}</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{t('assistant.pageSubtitle')}</p>
      </div>

      {loading ? (
        <LoadingSpinner label={t('assistant.loading')} />
      ) : (
        <div className="space-y-8">
          {greeting && (
            <div className="animate-fade-in-up rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-6 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:to-violet-950/40">
              <p className="font-medium text-indigo-900 dark:text-indigo-100">{greeting}</p>
              {summary && (
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{summary}</p>
              )}
              <p className="mt-3 text-xs text-slate-500">
                {t('assistant.suggestionsToday', { count: aiToday })}
              </p>
            </div>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('assistant.smartSuggestions')}
            </h2>
            <SuggestionCards suggestions={suggestions} />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('assistant.chatTitle')}
            </h2>
            <AssistantChat greeting={greeting} />
          </section>
        </div>
      )}
    </div>
  )
}
