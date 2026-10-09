import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { documentsApi } from '../services/documentsApi'
import type { Document } from '../types/document'

interface DocumentPreviewModalProps {
  document: Document | null
  onClose: () => void
}

export default function DocumentPreviewModal({
  document: doc,
  onClose,
}: DocumentPreviewModalProps) {
  const { t } = useTranslation()
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // When the selected document changes, clear the previous preview. Adjust the
  // state during render instead of setting it inside an effect.
  const docId = doc?.id ?? null
  const prevDocId = useRef(docId)
  if (prevDocId.current !== docId) {
    prevDocId.current = docId
    setBlobUrl(null)
  }

  useEffect(() => {
    if (!doc?.is_previewable) {
      return
    }

    let revoked = false
    let url: string | null = null

    documentsApi
      .preview(doc.id)
      .then((response) => {
        if (revoked) {
          return
        }
        url = URL.createObjectURL(response.data)
        setBlobUrl(url)
      })
      .catch(() => setError(t('documents.previewFailed')))
      .finally(() => setLoading(false))

    return () => {
      revoked = true
      if (url) {
        URL.revokeObjectURL(url)
      }
      setBlobUrl(null)
    }
  }, [doc, t])

  if (!doc) {
    return null
  }

  const isImage = doc.mime_type.startsWith('image/')
  const isPdf = doc.mime_type === 'application/pdf'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} aria-hidden />
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-slate-900">{doc.title}</h3>
            <p className="truncate text-xs text-slate-500">{doc.original_filename}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label={t('common.cancel')}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {loading && (
            <p className="py-12 text-center text-sm text-slate-500">{t('common.loading')}</p>
          )}
          {error && <p className="py-12 text-center text-sm text-red-600">{error}</p>}
          {!loading && !error && blobUrl && isImage && (
            <img
              src={blobUrl}
              alt={doc.title}
              className="mx-auto max-h-[70vh] rounded-lg object-contain shadow-sm"
            />
          )}
          {!loading && !error && blobUrl && isPdf && (
            <iframe
              src={blobUrl}
              title={doc.title}
              className="h-[70vh] w-full rounded-lg border border-slate-200 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  )
}
