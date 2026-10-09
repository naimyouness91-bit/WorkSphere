import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { complianceApi } from '../../services/complianceApi'
import type { Policy } from '../../types/compliance'

interface PoliciesPanelProps {
  policies: Policy[]
  canManage: boolean
  onRefresh: () => void
}

export default function PoliciesPanel({ policies, canManage, onRefresh }: PoliciesPanelProps) {
  const { t } = useTranslation()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [versionsPolicy, setVersionsPolicy] = useState<Policy | null>(null)
  const [versions, setVersions] = useState<Policy[]>([])
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    code: '',
    effective_date: new Date().toISOString().slice(0, 10),
    file: null as File | null,
  })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      if (form.code) fd.append('code', form.code)
      fd.append('effective_date', form.effective_date)
      fd.append('file', form.file)
      await complianceApi.uploadPolicy(fd)
      setUploadOpen(false)
      setForm({
        title: '',
        description: '',
        code: '',
        effective_date: new Date().toISOString().slice(0, 10),
        file: null,
      })
      onRefresh()
    } finally {
      setUploading(false)
    }
  }

  const loadVersions = async (policy: Policy) => {
    setVersionsPolicy(policy)
    const res = await complianceApi.policyVersions(policy.id)
    setVersions(res.data.data)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('compliance.policiesTitle')}
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setUploadOpen((v) => !v)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            {t('compliance.uploadPolicy')}
          </button>
        )}
      </div>

      {uploadOpen && canManage && (
        <form
          onSubmit={handleUpload}
          className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder={t('compliance.policyTitle')}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <input
              type="date"
              required
              value={form.effective_date}
              onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <input
              placeholder={t('compliance.policyCode')}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              className="text-sm"
            />
            <textarea
              placeholder={t('compliance.policyDescription')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {uploading ? t('common.loading') : t('compliance.submitPolicy')}
          </button>
        </form>
      )}

      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {policies.length === 0 ? (
          <li className="px-6 py-8 text-center text-sm text-slate-500">{t('compliance.noPolicies')}</li>
        ) : (
          policies.map((policy) => (
            <li key={policy.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{policy.title}</p>
                <p className="text-xs text-slate-500">
                  v{policy.version} · {t('compliance.effective')}: {policy.effective_date}
                </p>
                {policy.description && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{policy.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadVersions(policy)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-600"
                >
                  {t('compliance.versions')}
                </button>
                <button
                  type="button"
                  onClick={() => complianceApi.downloadPolicy(policy.id, policy.original_filename)}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
                >
                  {t('compliance.download')}
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      {versionsPolicy && (
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/40">
          <div className="mb-2 flex justify-between">
            <p className="text-sm font-semibold">{t('compliance.versionHistory', { title: versionsPolicy.title })}</p>
            <button type="button" onClick={() => setVersionsPolicy(null)} className="text-xs underline">
              {t('compliance.close')}
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {versions.map((v) => (
              <li key={v.id} className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>
                  v{v.version} {v.is_current ? `(${t('compliance.current')})` : ''}
                </span>
                <span>{v.effective_date}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
