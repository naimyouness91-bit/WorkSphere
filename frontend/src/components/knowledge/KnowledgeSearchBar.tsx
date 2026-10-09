import { useTranslation } from 'react-i18next'

export type KnowledgeContentType = '' | 'article' | 'faq' | 'document'

interface KnowledgeSearchBarProps {
  query: string
  category: string
  type: KnowledgeContentType
  categories: string[]
  onQueryChange: (q: string) => void
  onCategoryChange: (c: string) => void
  onTypeChange: (t: KnowledgeContentType) => void
  onSearch: () => void
}

export default function KnowledgeSearchBar({
  query,
  category,
  type,
  categories,
  onQueryChange,
  onCategoryChange,
  onTypeChange,
  onSearch,
}: KnowledgeSearchBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder={t('knowledge.searchPlaceholder')}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={onSearch}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {t('knowledge.search')}
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">{t('knowledge.allCategories')}</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as KnowledgeContentType)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">{t('knowledge.allTypes')}</option>
          <option value="article">{t('knowledge.typeArticle')}</option>
          <option value="faq">{t('knowledge.typeFaq')}</option>
          <option value="document">{t('knowledge.typeDocument')}</option>
        </select>
      </div>
    </div>
  )
}
