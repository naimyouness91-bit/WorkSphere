import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TicketFiltersBar from '../components/ticket/TicketFiltersBar'
import TicketSubmitModal from '../components/ticket/TicketSubmitModal'
import TicketDetailPanel from '../components/helpdesk/TicketDetailPanel'
import KpiCard from '../components/KpiCard'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { usersApi } from '../services/usersApi'
import { helpdeskApi } from '../services/helpdeskApi'
import {
  fetchTickets,
  openSubmitTicketForm,
  setTicketFilters,
} from '../store/ticketsSlice'
import type { AppUser } from '../types/userList'
import type { Ticket } from '../types/ticket'
import type { HelpdeskStats } from '../types/helpdesk'
import {
  TICKET_CATEGORY_STYLES,
  TICKET_PRIORITY_STYLES,
  TICKET_STATUS_STYLES,
} from '../utils/ticketBadges'
import { exportTicketsToPdf } from '../utils/exportTickets'
import * as XLSX from 'xlsx'

export default function TicketsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const { items, status, filters } = useAppSelector((s) => s.tickets)
  const [users, setUsers] = useState<AppUser[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [stats, setStats] = useState<HelpdeskStats | null>(null)

  const isManager = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    const timer = setTimeout(() => dispatch(fetchTickets(filters)), 200)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  useEffect(() => {
    helpdeskApi.overview().then((res) => setStats(res.data.data.stats))
    if (isManager) {
      usersApi.index().then((res) => setUsers(res.data.data))
    }
  }, [isManager])

  const assignees = useMemo(
    () => users.filter((u) => u.role === 'admin' || u.role === 'manager'),
    [users],
  )

  const handleTicketUpdated = (ticket: Ticket) => {
    setSelected(ticket)
    dispatch(fetchTickets(filters))
    helpdeskApi.overview().then((res) => setStats(res.data.data.stats))
  }

  const exportFromApi = async () => {
    const { data } = await helpdeskApi.export(filters)
    const sheet = XLSX.utils.json_to_sheet(data.data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, 'Tickets')
    XLSX.writeFile(workbook, 'worksphere-helpdesk.xlsx')
  }

  const renderBadges = (ticket: Ticket) => (
    <>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_STATUS_STYLES[ticket.status]}`}>
        {t(`tickets.status.${ticket.status}`)}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_PRIORITY_STYLES[ticket.priority]}`}>
        {t(`tickets.priority.${ticket.priority}`)}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_CATEGORY_STYLES[ticket.category]}`}>
        {t(`tickets.category.${ticket.category}`)}
      </span>
      {ticket.sla?.status === 'breached' && (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">
          SLA
        </span>
      )}
    </>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-r from-cyan-700 to-indigo-700 bg-clip-text text-3xl font-bold text-transparent dark:from-cyan-400 dark:to-indigo-400">
            {t('helpdesk.title')}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {isManager ? t('helpdesk.subtitleManager') : t('helpdesk.subtitleEmployee')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void exportFromApi()}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('tickets.exportExcel')}
          </button>
          <button
            type="button"
            onClick={() => exportTicketsToPdf(items, t('tickets.exportTitle'))}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 disabled:opacity-50"
          >
            {t('tickets.exportPdf')}
          </button>
          <button
            type="button"
            onClick={() => dispatch(openSubmitTicketForm())}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            {t('tickets.newTicket')}
          </button>
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label={t('helpdesk.kpiOpen')}
          value={stats?.open_tickets ?? items.filter((x) => x.status === 'open' || x.status === 'in_progress').length}
          accent="cyan"
        />
        <KpiCard label={t('helpdesk.kpiBreaches')} value={stats?.sla_breaches ?? 0} accent="amber" />
        <KpiCard
          label={t('helpdesk.kpiResolved')}
          value={stats?.resolved_tickets ?? items.filter((x) => x.status === 'resolved' || x.status === 'closed').length}
          accent="emerald"
        />
      </section>

      <div className="mt-6">
        <TicketFiltersBar filters={filters} onChange={(f) => dispatch(setTicketFilters(f))} />
      </div>

      {status === 'loading' && (
        <p className="mt-8 text-center text-slate-500">{t('common.loading')}</p>
      )}

      {status !== 'loading' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
              {items.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelected(ticket)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-start transition last:border-0 hover:bg-cyan-50/50 dark:border-slate-800 dark:hover:bg-cyan-950/20 ${
                    selected?.id === ticket.id ? 'bg-cyan-50 dark:bg-cyan-950/30' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{ticket.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1">{renderBadges(ticket)}</div>
                  <p className="mt-1 text-xs text-slate-500">
                    {ticket.employee?.name} · {ticket.created_at?.slice(0, 10)}
                  </p>
                </button>
              ))}
              {items.length === 0 && (
                <p className="py-8 text-center text-slate-500">{t('tickets.empty')}</p>
              )}
            </div>
          </div>
          <div className="lg:col-span-3">
            <TicketDetailPanel
              ticket={selected}
              isManager={isManager}
              assignees={assignees}
              onUpdated={handleTicketUpdated}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      )}

      <TicketSubmitModal />
    </div>
  )
}
