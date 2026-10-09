import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TicketSuggestions } from '../../types/helpdesk'

interface Props {
  suggestions: TicketSuggestions | null
  loading: boolean
}

export default function SuggestedSolutions({ suggestions, loading }: Props) {
  const { t } = useTranslation()

  return (
    <div className="rounded-xl border border-violet-200/50 bg-violet-50/30 p-4 dark:border-violet-900/30 dark:bg-violet-950/20">
      <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200">{t('helpdesk.suggestedTitle')}</h3>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('helpdesk.suggestedSub')}</p>

      {loading && <p className="mt-3 text-sm text-slate-500">{t('common.loading')}</p>}

      {!loading && suggestions && (
        <div className="mt-3 space-y-3">
          {suggestions.articles.length === 0 && suggestions.faqs.length === 0 && (
            <p className="text-sm text-slate-500">{t('helpdesk.noSuggestions')}</p>
          )}
          {suggestions.articles.map((a) => (
            <Link
              key={`a-${a.id}`}
              to="/knowledge"
              className="block rounded-lg border border-violet-100 bg-white p-3 transition hover:border-violet-300 dark:border-violet-900 dark:bg-slate-900 dark:hover:border-violet-700"
            >
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.excerpt}</p>
            </Link>
          ))}
          {suggestions.faqs.map((f) => (
            <div
              key={`f-${f.id}`}
              className="rounded-lg border border-violet-100 bg-white p-3 dark:border-violet-900 dark:bg-slate-900"
            >
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{f.question}</p>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{f.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
