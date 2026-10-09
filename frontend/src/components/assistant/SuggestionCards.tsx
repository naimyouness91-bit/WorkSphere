import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { AssistantSuggestion } from '../../types/assistant'

const CATEGORY_STYLES: Record<string, string> = {
  request: 'from-indigo-500 to-indigo-600',
  training: 'from-violet-500 to-violet-600',
  payroll: 'from-amber-500 to-orange-600',
  analytics: 'from-emerald-500 to-teal-600',
}

const PRIORITY_RING: Record<string, string> = {
  high: 'ring-2 ring-red-400/50',
  medium: 'ring-1 ring-amber-400/40',
  low: '',
}

interface Props {
  suggestions: AssistantSuggestion[]
}

export default function SuggestionCards({ suggestions }: Props) {
  const { t } = useTranslation()

  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('assistant.noSuggestions')}</p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {suggestions.map((s) => (
        <Link
          key={s.id}
          to={s.action_path}
          className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-800 ${PRIORITY_RING[s.priority] ?? ''}`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${CATEGORY_STYLES[s.category] ?? CATEGORY_STYLES.analytics} text-xs font-bold uppercase text-white`}
            >
              {s.category.slice(0, 3)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                {t(`assistant.categories.${s.category}`)}
              </p>
              <h3 className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.description}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
