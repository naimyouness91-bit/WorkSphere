import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SignaturePad from './SignaturePad'
import { complianceApi } from '../../services/complianceApi'
import { api } from '../../services/api'
import type { UserRole } from '../../types/auth'
import type { Contract, ContractStatus } from '../../types/compliance'

interface ContractsPanelProps {
  contracts: Contract[]
  canManage: boolean
  currentUserId?: number
  onRefresh: () => void
}

const statusStyles: Record<ContractStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  signed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  expired: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

interface EmployeeOption {
  id: number
  name: string
}

export default function ContractsPanel({
  contracts,
  canManage,
  currentUserId,
  onRefresh,
}: ContractsPanelProps) {
  const { t } = useTranslation()
  const [signingId, setSigningId] = useState<number | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [employees, setEmployees] = useState<EmployeeOption[]>([])
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    employee_id: '',
    expires_at: '',
    file: null as File | null,
  })

  useEffect(() => {
    if (!canManage || !publishOpen) return
    api
      .get<{ data: Array<{ id: number; name: string; role: UserRole }> }>('/users')
      .then((res) => {
        const list = res.data.data ?? []
        setEmployees(
          list
            .filter((u) => u.role === 'employee')
            .map((u) => ({ id: u.id, name: u.name })),
        )
      })
  }, [canManage, publishOpen])

  const handleSign = async (contractId: number) => {
    if (!signature) return
    setSubmitting(true)
    try {
      await complianceApi.signContract(contractId, signature)
      setSigningId(null)
      setSignature(null)
      onRefresh()
    } finally {
      setSubmitting(false)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!publishForm.file || !publishForm.employee_id) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', publishForm.title)
      fd.append('description', publishForm.description)
      fd.append('employee_id', publishForm.employee_id)
      if (publishForm.expires_at) fd.append('expires_at', publishForm.expires_at)
      fd.append('file', publishForm.file)
      await complianceApi.publishContract(fd)
      setPublishOpen(false)
      onRefresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {t('compliance.contractsTitle')}
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={() => setPublishOpen((v) => !v)}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-600"
          >
            {t('compliance.publishContract')}
          </button>
        )}
      </div>

      {publishOpen && canManage && (
        <form
          onSubmit={handlePublish}
          className="border-b border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/50"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder={t('compliance.contractTitle')}
              value={publishForm.title}
              onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <select
              required
              value={publishForm.employee_id}
              onChange={(e) => setPublishForm({ ...publishForm, employee_id: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="">{t('compliance.selectEmployee')}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={publishForm.expires_at}
              onChange={(e) => setPublishForm({ ...publishForm, expires_at: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
            <input
              type="file"
              required
              accept=".pdf"
              onChange={(e) => setPublishForm({ ...publishForm, file: e.target.files?.[0] ?? null })}
              className="text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {t('compliance.submitContract')}
          </button>
        </form>
      )}

      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {contracts.length === 0 ? (
          <li className="px-6 py-8 text-center text-sm text-slate-500">{t('compliance.noContracts')}</li>
        ) : (
          contracts.map((contract) => {
            return (
              <li key={contract.id} className="px-6 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{contract.title}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[contract.status]}`}
                      >
                        {t(`compliance.status.${contract.status}`)}
                      </span>
                    </div>
                    {canManage && contract.employee && (
                      <p className="text-xs text-slate-500">{contract.employee.name}</p>
                    )}
                    {contract.expires_at && (
                      <p className="text-xs text-slate-500">
                        {t('compliance.expires')}: {contract.expires_at}
                      </p>
                    )}
                    {contract.signed_at && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        {t('compliance.signedAt')}: {new Date(contract.signed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        complianceApi.downloadContract(contract.id, contract.original_filename)
                      }
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium dark:border-slate-600"
                    >
                      {t('compliance.download')}
                    </button>
                    {contract.status === 'pending' && currentUserId === contract.employee_id && (
                      <button
                        type="button"
                        onClick={() => setSigningId(contract.id)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        {t('compliance.signContract')}
                      </button>
                    )}
                  </div>
                </div>

                {signingId === contract.id && (
                  <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
                    <SignaturePad onChange={setSignature} disabled={submitting} />
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={!signature || submitting}
                        onClick={() => handleSign(contract.id)}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {submitting ? t('common.loading') : t('compliance.confirmSign')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSigningId(null)
                          setSignature(null)
                        }}
                        className="text-sm text-slate-600 underline dark:text-slate-400"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}
