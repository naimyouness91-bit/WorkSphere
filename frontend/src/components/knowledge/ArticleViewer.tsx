import { useTranslation } from 'react-i18next'
import type { KnowledgeArticle } from '../../types/knowledge'
import MarkdownViewer from './MarkdownViewer'

interface ArticleViewerProps {
  article: KnowledgeArticle
  onClose: () => void
  onRate: (helpful: boolean) => void
  ratingLoading?: boolean
}

export default function ArticleViewer({ article, onClose, onRate, ratingLoading }: ArticleViewerProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <article className="my-8 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
          <div>
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
              {article.category} · v{article.version}
            </span>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{article.title}</h2>
            {article.author && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t('knowledge.byAuthor', { name: article.author.name })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={t('knowledge.close')}
          >
            ✕
          </button>
        </header>
        <div className="px-6 py-6">
          <MarkdownViewer content={article.content} />
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('knowledge.wasHelpful')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={ratingLoading || article.user_rating === true}
              onClick={() => onRate(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                article.user_rating === true
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {t('knowledge.helpful')} ({article.helpful_count})
            </button>
            <button
              type="button"
              disabled={ratingLoading || article.user_rating === false}
              onClick={() => onRate(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                article.user_rating === false
                  ? 'bg-slate-600 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {t('knowledge.notHelpful')} ({article.not_helpful_count})
            </button>
          </div>
        </footer>
      </article>
    </div>
  )
}
