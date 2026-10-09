import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import ConfirmModal from '../components/ConfirmModal'
import DocumentPreviewModal from '../components/DocumentPreviewModal'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { documentsApi } from '../services/documentsApi'
import {
  ALLOWED_FILE_ACCEPT,
  emptyDocumentForm,
  formatFileSize,
  type DocumentFormData,
} from '../types/document'
import {
  closeDeleteModal,
  closePreview,
  closeUploadForm,
  deleteDocument,
  fetchDocuments,
  openDeleteModal,
  openPreview,
  openUploadForm,
  uploadDocument,
} from '../store/documentsSlice'
import { addNotification } from '../store/notificationSlice'

export default function DocumentsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const {
    items,
    status,
    error,
    mutationStatus,
    isUploadOpen,
    isDeleteModalOpen,
    documentToDelete,
    previewDocument,
  } = useAppSelector((state) => state.documents)

  const [form, setForm] = useState<DocumentFormData>(emptyDocumentForm())
  const showOwner = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    dispatch(fetchDocuments()).then((result) => {
      if (fetchDocuments.rejected.match(result)) {
        dispatch(
          addNotification({
            type: 'error',
            message: (result.payload as string) ?? t('documents.loadFailed'),
          }),
        )
      }
    })
  }, [dispatch, t])

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault()
    await dispatch(uploadDocument(form))
    setForm(emptyDocumentForm())
  }

  const handleDownload = async (id: number, filename: string) => {
    try {
      const { data } = await documentsApi.download(id)
      const url = URL.createObjectURL(data)
      const link = window.document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      dispatch(
        addNotification({
          type: 'error',
          message: t('documents.downloadFailed'),
        }),
      )
    }
  }

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      dispatch(deleteDocument(documentToDelete.id))
    }
  }

  const canDelete = (ownerId: number) =>
    user?.role === 'admin' || user?.id === ownerId

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('documents.title')}</h1>
          <p className="mt-1 text-slate-600">
            {showOwner ? t('documents.subtitleAdmin') : t('documents.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(openUploadForm())}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          {t('documents.upload')}
        </button>
      </div>

      {isUploadOpen && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">{t('documents.uploadTitle')}</h2>
          <form onSubmit={handleUpload} className="mt-4 space-y-4">
            <div>
              <label htmlFor="doc-title" className="block text-sm font-medium text-slate-700">
                {t('documents.titleField')} *
              </label>
              <input
                id="doc-title"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="doc-desc" className="block text-sm font-medium text-slate-700">
                {t('documents.description')}
              </label>
              <textarea
                id="doc-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="doc-file" className="block text-sm font-medium text-slate-700">
                {t('documents.file')} *
              </label>
              <input
                id="doc-file"
                type="file"
                required
                accept={ALLOWED_FILE_ACCEPT}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    file: e.target.files?.[0] ?? null,
                  }))
                }
                className="mt-1 block w-full text-sm text-slate-600 file:me-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="mt-1 text-xs text-slate-500">{t('documents.fileHint')}</p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={mutationStatus === 'loading'}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {mutationStatus === 'loading'
                  ? t('documents.uploading')
                  : t('documents.submitUpload')}
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(closeUploadForm())
                  setForm(emptyDocumentForm())
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {status === 'loading' ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('documents.loading')}</div>
        ) : error ? (
          <div className="px-6 py-16 text-center text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">{t('documents.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('documents.titleField')}
                  </th>
                  {showOwner && (
                    <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                      {t('documents.owner')}
                    </th>
                  )}
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('documents.file')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('documents.uploadedAt')}
                  </th>
                  <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-slate-600">
                    {t('employees.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{doc.title}</p>
                      {doc.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                          {doc.description}
                        </p>
                      )}
                    </td>
                    {showOwner && (
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {doc.employee?.name ?? '—'}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      <span className="block truncate max-w-[180px]" title={doc.original_filename}>
                        {doc.original_filename}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {new Date(doc.uploaded_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-end text-sm">
                      <div className="flex justify-end gap-2">
                        {doc.is_previewable && (
                          <button
                            type="button"
                            onClick={() => dispatch(openPreview(doc))}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {t('documents.preview')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownload(doc.id, doc.original_filename)}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          {t('documents.download')}
                        </button>
                        {canDelete(doc.employee_id) && (
                          <button
                            type="button"
                            onClick={() => dispatch(openDeleteModal(doc))}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            {t('common.delete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DocumentPreviewModal
        document={previewDocument}
        onClose={() => dispatch(closePreview())}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title={t('documents.deleteTitle')}
        message={
          documentToDelete
            ? t('documents.deleteMessage', { title: documentToDelete.title })
            : ''
        }
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        isLoading={mutationStatus === 'loading'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => dispatch(closeDeleteModal())}
      />
    </div>
  )
}
