import { useTranslation } from 'react-i18next'
import type { AnalyticsInsight } from '../../types/analyticsInsight'

const CATEGORY_STYLES: Record<string, string> = {
  turnover: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30',
  performance: 'border-indigo-200 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-950/30',
  finance: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30',
  hr: 'border-cyan-200 bg-cyan-50 dark:border-cyan-900/50 dark:bg-cyan-950/30',
  recommendation: 'border-violet-200 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30',
}

interface Props {
  insights: AnalyticsInsight[]
  onRefresh?: () => void
  refreshing?: boolean
}

export default function InsightCards({ insights, onRefresh, refreshing }: Props) {
  const { t } = useTranslation()

  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('analytics.predictiveInsights')}
        </h2>
        {onRefresh && (
          <button
            type="button"
            disabled={refreshing}
            onClick={onRefresh}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {refreshing ? t('analytics.refreshing') : t('analytics.refreshInsights')}
          </button>
        )}
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-slate-500">{t('analytics.noInsights')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => (
            <article
              key={insight.id}
              className={`rounded-xl border p-4 shadow-sm ${CATEGORY_STYLES[insight.category] ?? 'border-slate-200 bg-white dark:bg-slate-900'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t(`analytics.categories.${insight.category}`, insight.category)}
                </span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-violet-700 dark:bg-slate-800 dark:text-violet-300">
                  {Math.round(insight.confidence_score * 100)}%
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-slate-900 dark:text-slate-50">{insight.title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{insight.description}</p>
              {insight.recommendation?.action && (
                <p className="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs font-medium text-violet-800 dark:bg-slate-900/60 dark:text-violet-200">
                  {t('analytics.aiRecommendation')}: {insight.recommendation.action}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
