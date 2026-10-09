interface ResumePreviewModalProps {
  url: string | null
  filename: string
  onClose: () => void
}

export default function ResumePreviewModal({ url, filename, onClose }: ResumePreviewModalProps) {
  if (!url) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {filename}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </header>
        <iframe title={filename} src={url} className="min-h-0 flex-1 w-full" />
      </div>
    </div>
  )
}
