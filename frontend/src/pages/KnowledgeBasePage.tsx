import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ArticleViewer from '../components/knowledge/ArticleViewer'
import DocumentLibrary from '../components/knowledge/DocumentLibrary'
import FaqAccordion from '../components/knowledge/FaqAccordion'
import KnowledgeSearchBar, { type KnowledgeContentType } from '../components/knowledge/KnowledgeSearchBar'
import LoadingSpinner from '../components/LoadingSpinner'
import { knowledgeApi } from '../services/knowledgeApi'
import type {
  KnowledgeArticle,
  KnowledgeDocument,
  KnowledgeFaq,
  KnowledgeOverview,
  KnowledgeSearchResults,
} from '../types/knowledge'

type Tab = 'articles' | 'faqs' | 'documents'

export default function KnowledgeBasePage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<KnowledgeOverview | null>(null)
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [faqs, setFaqs] = useState<KnowledgeFaq[]>([])
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('articles')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterType, setFilterType] = useState<KnowledgeContentType>('')
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResults | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)
  const [ratingLoading, setRatingLoading] = useState(false)
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [showDocForm, setShowDocForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [docTitle, setDocTitle] = useState('')
  const [docDesc, setDocDesc] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadContent = useCallback(() => {
    Promise.all([
      knowledgeApi.overview(),
      knowledgeApi.articles(filterCategory || undefined),
      knowledgeApi.faqs(filterCategory || undefined),
      knowledgeApi.documents(),
    ])
      .then(([ov, art, fq, docs]) => {
        setOverview(ov.data.data)
        setArticles(art.data.data)
        setFaqs(fq.data.data)
        setDocuments(docs.data.data)
      })
      .finally(() => setLoading(false))
  }, [filterCategory])

  useEffect(() => {
    loadContent()
  }, [loadContent])

  const handleSearch = () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null)
      return
    }
    knowledgeApi
      .search(
        searchQuery.trim(),
        filterCategory || undefined,
        filterType || undefined,
      )
      .then((res) => setSearchResults(res.data.data))
  }

  const openArticle = (id: number) => {
    knowledgeApi.article(id).then((res) => setSelectedArticle(res.data.data))
  }

  const handleRate = (helpful: boolean) => {
    if (!selectedArticle) return
    setRatingLoading(true)
    knowledgeApi
      .rateArticle(selectedArticle.id, helpful)
      .then((res) => {
        setSelectedArticle({
          ...selectedArticle,
          helpful_count: res.data.data.helpful_count,
          not_helpful_count: res.data.data.not_helpful_count,
          user_rating: res.data.data.user_rating,
        })
      })
      .finally(() => setRatingLoading(false))
  }

  const submitArticle = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    knowledgeApi
      .addArticle({ title: newTitle, content: newContent, category: newCategory })
      .then(() => {
        setShowArticleForm(false)
        setNewTitle('')
        setNewContent('')
        loadContent()
      })
      .finally(() => setSubmitting(false))
  }

  const submitDocument = (e: React.FormEvent) => {
    e.preventDefault()
    if (!docFile) return
    const form = new FormData()
    form.append('title', docTitle)
    form.append('description', docDesc)
    form.append('file', docFile)
    setSubmitting(true)
    knowledgeApi
      .uploadDocument(form)
      .then(() => {
        setShowDocForm(false)
        setDocTitle('')
        setDocDesc('')
        setDocFile(null)
        loadContent()
      })
      .finally(() => setSubmitting(false))
  }

  const displayArticles = searchResults?.articles ?? articles
  const displayFaqs = searchResults?.faqs ?? faqs
  const displayDocuments = searchResults?.documents ?? documents

  if (loading && !overview) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <LoadingSpinner label={t('knowledge.loading')} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 rounded-2xl border border-slate-300 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">{t('knowledge.title')}</h1>
        <p className="mt-2 text-indigo-100">{t('knowledge.subtitle')}</p>
        {overview && (
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-lg bg-white/10 px-3 py-1">
              {t('knowledge.statArticles')}: {overview.stats.articles_count}
            </span>
            <span className="rounded-lg bg-white/10 px-3 py-1">
              {t('knowledge.statFaqs')}: {overview.stats.faqs_count}
            </span>
            <span className="rounded-lg bg-white/10 px-3 py-1">
              {t('knowledge.statDocuments')}: {overview.stats.documents_count}
            </span>
            <span className="rounded-lg bg-emerald-500/30 px-3 py-1 font-semibold">
              {t('knowledge.statUpdates')}: {overview.stats.recent_updates}
            </span>
          </div>
        )}
      </header>

      <KnowledgeSearchBar
        query={searchQuery}
        category={filterCategory}
        type={filterType}
        categories={overview?.categories ?? []}
        onQueryChange={setSearchQuery}
        onCategoryChange={(c) => {
          setFilterCategory(c)
          setSearchResults(null)
        }}
        onTypeChange={setFilterType}
        onSearch={handleSearch}
      />

      {overview && overview.suggested_articles.length > 0 && !searchResults && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('knowledge.suggested')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {overview.suggested_articles.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openArticle(a.id)}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
              >
                {a.title}
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <nav className="flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
          {(['articles', 'faqs', 'documents'] as Tab[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id)
                setSearchResults(null)
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                tab === id
                  ? 'bg-white text-indigo-700 shadow dark:bg-slate-900 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              {t(`knowledge.tab${id.charAt(0).toUpperCase()}${id.slice(1)}`)}
            </button>
          ))}
        </nav>
        {overview?.can_manage && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowArticleForm((v) => !v)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium dark:border-slate-600"
            >
              {t('knowledge.addArticle')}
            </button>
            <button
              type="button"
              onClick={() => setShowDocForm((v) => !v)}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
            >
              {t('knowledge.uploadDocument')}
            </button>
          </div>
        )}
      </div>

      {showArticleForm && overview?.can_manage && (
        <form onSubmit={submitArticle} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <input
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('knowledge.articleTitle')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder={t('knowledge.category')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <textarea
            required
            rows={8}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={t('knowledge.articleContent')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {t('knowledge.publish')}
          </button>
        </form>
      )}

      {showDocForm && overview?.can_manage && (
        <form onSubmit={submitDocument} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <input
            required
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder={t('knowledge.docTitle')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <textarea
            value={docDesc}
            onChange={(e) => setDocDesc(e.target.value)}
            placeholder={t('knowledge.docDescription')}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
          <input
            type="file"
            required
            onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !docFile}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {t('knowledge.upload')}
          </button>
        </form>
      )}

      <section className="mt-6">
        {searchResults && (
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{t('knowledge.searchResults')}</p>
        )}
        {tab === 'articles' && (
          <ul className="space-y-2">
            {displayArticles.length === 0 ? (
              <p className="text-sm text-slate-500">{t('knowledge.noArticles')}</p>
            ) : (
              displayArticles.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => openArticle(a.id)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-700"
                  >
                    <span className="text-xs font-medium uppercase text-indigo-600 dark:text-indigo-400">
                      {a.category}
                    </span>
                    <h3 className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      v{a.version}
                      {a.author ? ` · ${a.author.name}` : ''}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
        {tab === 'faqs' && <FaqAccordion faqs={displayFaqs} />}
        {tab === 'documents' && <DocumentLibrary documents={displayDocuments} />}
      </section>

      {selectedArticle && (
        <ArticleViewer
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onRate={handleRate}
          ratingLoading={ratingLoading}
        />
      )}
    </div>
  )
}
