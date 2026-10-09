import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { knowledgeApi } from '../../services/knowledgeApi'
import type { KnowledgeDocument } from '../../types/knowledge'

interface DocumentLibraryProps {
  documents: KnowledgeDocument[]
}

export default function DocumentLibrary({ documents }: DocumentLibraryProps) {
  const { t } = useTranslation()

  const openPreview = async (doc: KnowledgeDocument) => {
    if (doc.mime_type === 'application/pdf') {
      const res = await api.get<Blob>(`/knowledge/documents/${doc.id}/preview`, {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(res.data)
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } else {
      knowledgeApi.downloadDocument(doc.id, doc.original_filename)
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('knowledge.noDocuments')}</p>
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{doc.title}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            v{doc.version} · {(doc.file_size / 1024).toFixed(1)} KB
          </p>
          {doc.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{doc.description}</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => openPreview(doc)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t('knowledge.view')}
            </button>
            <button
              type="button"
              onClick={() => knowledgeApi.downloadDocument(doc.id, doc.original_filename)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 dark:bg-indigo-500"
            >
              {t('knowledge.download')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
