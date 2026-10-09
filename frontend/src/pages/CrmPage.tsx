import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DealPipeline from '../components/crm/DealPipeline'
import InteractionTimeline from '../components/crm/InteractionTimeline'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppSelector } from '../hooks/redux'
import { crmApi } from '../services/crmApi'
import type {
  CrmClient,
  CrmDeal,
  CrmInteraction,
  CrmOverview,
  CrmPartner,
  DealStage,
  InteractionType,
} from '../types/crm'
import { exportRowsToCsv, exportRowsToExcel } from '../utils/exportCrm'

type Tab = 'clients' | 'partners' | 'deals' | 'timeline'

export default function CrmPage() {
  const { t } = useTranslation()
  const { user } = useAppSelector((s) => s.auth)
  const isManager = user?.role === 'admin' || user?.role === 'manager'

  const [overview, setOverview] = useState<CrmOverview | null>(null)
  const [clients, setClients] = useState<CrmClient[]>([])
  const [partners, setPartners] = useState<CrmPartner[]>([])
  const [deals, setDeals] = useState<CrmDeal[]>([])
  const [interactions, setInteractions] = useState<CrmInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('clients')
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [clientFilter, setClientFilter] = useState<number | ''>('')

  const [showClientForm, setShowClientForm] = useState(false)
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [showDealForm, setShowDealForm] = useState(false)
  const [showInteractionForm, setShowInteractionForm] = useState(false)

  const load = useCallback(() => {
    Promise.all([
      crmApi.overview(),
      crmApi.clients({ status: statusFilter || undefined, company: companyFilter || undefined }),
      crmApi.partners({ status: statusFilter || undefined }),
      crmApi.deals(clientFilter ? { client_id: clientFilter } : undefined),
      crmApi.interactions({
        client_id: clientFilter || undefined,
        limit: 40,
      }),
    ])
      .then(([ov, cl, pa, de, inter]) => {
        setOverview(ov.data.data)
        setClients(cl.data.data)
        setPartners(pa.data.data)
        setDeals(de.data.data)
        setInteractions(inter.data.data)
      })
      .finally(() => setLoading(false))
  }, [statusFilter, companyFilter, clientFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleDealStage = (id: number, stage: DealStage, status?: 'won' | 'lost') => {
    crmApi.updateDealStatus(id, { stage, status }).then(() => load())
  }

  const handleExportClients = async (fmt: 'csv' | 'xlsx') => {
    const res = await crmApi.exportClients({
      status: statusFilter || undefined,
      company: companyFilter || undefined,
    })
    const rows = res.data.data
    if (fmt === 'csv') exportRowsToCsv(rows, 'worksphere-clients.csv')
    else exportRowsToExcel(rows, 'Clients', 'worksphere-clients.xlsx')
  }

  const handleSyncDemo = () => {
    if (!clients[0]) return
    crmApi
      .syncIntegrations({
        source: 'email',
        interactions: [
          {
            external_id: `demo-email-${Date.now()}`,
            client_id: clients[0].id,
            type: 'email',
            subject: 'Follow-up: proposal sent',
            notes: 'Auto-logged from email integration (demo).',
            occurred_at: new Date().toISOString(),
          },
        ],
      })
      .then(() => load())
  }

  if (loading && !overview) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <LoadingSpinner label={t('crm.loading')} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-tight">{t('crm.title')}</h1>
        <p className="mt-2 text-indigo-100">{t('crm.subtitle')}</p>
      </header>

      {overview && (
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <KpiCard label={t('crm.kpiActiveClients')} value={overview.stats.active_clients} accent="indigo" />
          <KpiCard label={t('crm.kpiPipeline')} value={overview.stats.deals_in_pipeline} accent="amber" />
          <KpiCard
            label={t('crm.kpiClosedDeals')}
            value={overview.stats.closed_deals}
            subtext={t('crm.kpiPipelineValue', {
              value: overview.stats.pipeline_value.toLocaleString(),
            })}
            accent="emerald"
          />
        </section>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('crm.allStatuses')}</option>
          <option value="active">{t('crm.statusActive')}</option>
          <option value="inactive">{t('crm.statusInactive')}</option>
        </select>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('crm.allCompanies')}</option>
          {overview?.companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value ? Number(e.target.value) : '')}
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <option value="">{t('crm.allClients')}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {isManager && (
          <>
            <button
              type="button"
              onClick={() => handleExportClients('xlsx')}
              className="rounded-lg bg-indigo-700 px-3 py-2 text-sm text-white"
            >
              {t('crm.exportExcel')}
            </button>
            <button
              type="button"
              onClick={handleSyncDemo}
              className="rounded-lg border border-indigo-300 px-3 py-2 text-sm dark:border-indigo-600"
            >
              {t('crm.syncEmailDemo')}
            </button>
          </>
        )}
      </div>

      <nav className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        {(['clients', 'partners', 'deals', 'timeline'] as Tab[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              tab === id
                ? 'bg-white text-indigo-700 shadow dark:bg-slate-900 dark:text-indigo-300'
                : 'text-slate-600'
            }`}
          >
            {t(`crm.tab${id.charAt(0).toUpperCase()}${id.slice(1)}`)}
          </button>
        ))}
      </nav>

      {tab === 'clients' && (
        <section>
          {isManager && (
            <button
              type="button"
              onClick={() => setShowClientForm((v) => !v)}
              className="mb-4 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white"
            >
              {t('crm.addClient')}
            </button>
          )}
          {showClientForm && isManager && (
            <ClientForm
              onDone={() => {
                setShowClientForm(false)
                load()
              }}
            />
          )}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">{t('crm.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">{t('crm.company')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">{t('crm.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase">{t('crm.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-sm">{c.company}</td>
                    <td className="px-4 py-3 text-sm">{c.email ?? '—'}</td>
                    <td className="px-4 py-3 text-sm capitalize">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'partners' && (
        <section>
          {isManager && (
            <button
              type="button"
              onClick={() => setShowPartnerForm((v) => !v)}
              className="mb-4 rounded-lg border px-3 py-2 text-sm dark:border-slate-600"
            >
              {t('crm.addPartner')}
            </button>
          )}
          {showPartnerForm && isManager && (
            <PartnerForm
              onDone={() => {
                setShowPartnerForm(false)
                load()
              }}
            />
          )}
          <ul className="grid gap-3 sm:grid-cols-2">
            {partners.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">{p.organization}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{p.contact_info ?? '—'}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'deals' && (
        <section>
          {isManager && (
            <button
              type="button"
              onClick={() => setShowDealForm((v) => !v)}
              className="mb-4 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white"
            >
              {t('crm.addDeal')}
            </button>
          )}
          {showDealForm && isManager && clients.length > 0 && (
            <DealForm clients={clients} onDone={() => { setShowDealForm(false); load() }} />
          )}
          <DealPipeline deals={deals} canManage={isManager} onStageChange={handleDealStage} />
        </section>
      )}

      {tab === 'timeline' && (
        <section>
          <button
            type="button"
            onClick={() => setShowInteractionForm((v) => !v)}
            className="mb-4 rounded-lg border px-3 py-2 text-sm dark:border-slate-600"
          >
            {t('crm.logInteraction')}
          </button>
          {showInteractionForm && (
            <InteractionForm
              clients={clients}
              partners={partners}
              onDone={() => {
                setShowInteractionForm(false)
                load()
              }}
            />
          )}
          <InteractionTimeline interactions={interactions} />
        </section>
      )}
    </div>
  )
}

function ClientForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    crmApi.addClient({ name, company, email: email || undefined, phone: phone || undefined }).then(onDone)
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-2 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('crm.name')} className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <input required value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t('crm.company')} className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('crm.email')} className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('crm.phone')} className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">{t('crm.save')}</button>
    </form>
  )
}

function PartnerForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [contactInfo, setContactInfo] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    crmApi.addPartner({ name, organization, contact_info: contactInfo || undefined }).then(onDone)
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-2 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('crm.name')} className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <input required value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder={t('crm.organization')} className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <textarea value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder={t('crm.contactInfo')} className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">{t('crm.save')}</button>
    </form>
  )
}

function DealForm({ clients, onDone }: { clients: CrmClient[]; onDone: () => void }) {
  const { t } = useTranslation()
  const [clientId, setClientId] = useState(String(clients[0]?.id ?? ''))
  const [title, setTitle] = useState('')
  const [value, setValue] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    crmApi.addDeal({ client_id: Number(clientId), title, value: Number(value) || 0 }).then(onDone)
  }

  return (
    <form onSubmit={submit} className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <select required value={clientId} onChange={(e) => setClientId(e.target.value)} className="rounded border px-3 py-2 text-sm dark:bg-slate-800">
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('crm.dealTitle')} className="rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={t('crm.dealValue')} className="w-32 rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">{t('crm.save')}</button>
    </form>
  )
}

function InteractionForm({
  clients,
  partners,
  onDone,
}: {
  clients: CrmClient[]
  partners: CrmPartner[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const [target, setTarget] = useState<'client' | 'partner'>('client')
  const [targetId, setTargetId] = useState<number | ''>('')
  const [type, setType] = useState<InteractionType>('call')
  const [notes, setNotes] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetId) return
    crmApi
      .logInteraction({
        client_id: target === 'client' ? Number(targetId) : undefined,
        partner_id: target === 'partner' ? Number(targetId) : undefined,
        type,
        notes: notes || undefined,
      })
      .then(onDone)
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-2 rounded-xl border bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex gap-2">
        <select value={target} onChange={(e) => { setTarget(e.target.value as 'client' | 'partner'); setTargetId('') }} className="rounded border px-2 py-1 text-sm dark:bg-slate-800">
          <option value="client">{t('crm.client')}</option>
          <option value="partner">{t('crm.partner')}</option>
        </select>
        <select required value={targetId} onChange={(e) => setTargetId(Number(e.target.value))} className="flex-1 rounded border px-2 py-1 text-sm dark:bg-slate-800">
          <option value="">—</option>
          {(target === 'client' ? clients : partners).map((item) => (
            <option key={item.id} value={item.id}>
              {'name' in item && 'company' in item ? `${item.name} (${item.company})` : `${item.name} (${item.organization})`}
            </option>
          ))}
        </select>
      </div>
      <select value={type} onChange={(e) => setType(e.target.value as InteractionType)} className="w-full rounded border px-2 py-1 text-sm dark:bg-slate-800">
        <option value="call">{t('crm.interactionType.call')}</option>
        <option value="meeting">{t('crm.interactionType.meeting')}</option>
        <option value="email">{t('crm.interactionType.email')}</option>
      </select>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('crm.notes')} className="w-full rounded border px-3 py-2 text-sm dark:bg-slate-800" />
      <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">{t('crm.save')}</button>
    </form>
  )
}
