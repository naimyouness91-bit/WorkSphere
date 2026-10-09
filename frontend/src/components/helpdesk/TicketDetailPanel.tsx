import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { helpdeskApi } from '../../services/helpdeskApi'
import type { TicketSuggestions } from '../../types/helpdesk'
import type { Ticket, TicketStatus } from '../../types/ticket'
import {
  TICKET_PRIORITY_STYLES,
  TICKET_STATUS_STYLES,
} from '../../utils/ticketBadges'
import LiveSupportChat from './LiveSupportChat'
import SlaTracker from './SlaTracker'
import SuggestedSolutions from './SuggestedSolutions'
import TicketTimeline from './TicketTimeline'
import type { AppUser } from '../../types/userList'

interface Props {
  ticket: Ticket | null
  isManager: boolean
  assignees: AppUser[]
  onUpdated: (ticket: Ticket) => void
  onClose: () => void
}

export default function TicketDetailPanel({
  ticket,
  isManager,
  assignees,
  onUpdated,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const [detail, setDetail] = useState<Ticket | null>(ticket)
  const [suggestions, setSuggestions] = useState<TicketSuggestions | null>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [assigneeId, setAssigneeId] = useState<string>('')
  const [busy, setBusy] = useState(false)

  const ticketId = ticket?.id ?? null

  // Keep a stable reference to the latest callback so the data-fetching effect
  // only re-runs when the selected ticket changes (not on every parent render).
  const onUpdatedRef = useRef(onUpdated)
  useEffect(() => {
    onUpdatedRef.current = onUpdated
  })

  // Reset the locally-edited fields whenever the selected ticket changes
  // (adjust state during render instead of setting it inside an effect).
  const [prevTicketId, setPrevTicketId] = useState(ticket?.id ?? null)
  if (prevTicketId !== (ticket?.id ?? null)) {
    setPrevTicketId(ticket?.id ?? null)
    if (!ticket) {
      setDetail(null)
    } else {
      setDetail(ticket)
      setStatus(ticket.status)
      setAssigneeId(ticket.assigned_to ? String(ticket.assigned_to) : '')
      setSuggestionsLoading(true)
    }
  }

  useEffect(() => {
    if (ticketId == null) return
    helpdeskApi
      .getTicket(ticketId)
      .then((res) => {
        setDetail(res.data.data)
        onUpdatedRef.current(res.data.data)
      })
      .finally(() => setSuggestionsLoading(false))

    helpdeskApi.getSuggestions(ticketId).then((res) => setSuggestions(res.data.data))
  }, [ticketId])

  if (!ticket || !detail) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-600">
        {t('helpdesk.selectTicket')}
      </div>
    )
  }

  const saveAssign = async () => {
    setBusy(true)
    try {
      const { data } = await helpdeskApi.assignTicket(
        detail.id,
        assigneeId ? Number(assigneeId) : null,
      )
      setDetail(data.data)
      onUpdated(data.data)
    } finally {
      setBusy(false)
    }
  }

  const saveStatus = async () => {
    if (!status) return
    setBusy(true)
    try {
      const { data } = await helpdeskApi.updateStatus(detail.id, status)
      setDetail(data.data)
      onUpdated(data.data)
    } finally {
      setBusy(false)
    }
  }

  const postComment = async () => {
    if (!comment.trim()) return
    setBusy(true)
    try {
      const { data } = await helpdeskApi.addComment(detail.id, comment.trim())
      setDetail(data.data)
      onUpdated(data.data)
      setComment('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{detail.title}</h2>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className={`rounded-full px-2 py-0.5 text-xs ${TICKET_STATUS_STYLES[detail.status]}`}>
              {t(`tickets.status.${detail.status}`)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${TICKET_PRIORITY_STYLES[detail.priority]}`}>
              {t(`tickets.priority.${detail.priority}`)}
            </span>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">{detail.description}</p>

        {detail.sla && <SlaTracker sla={detail.sla} />}

        <SuggestedSolutions suggestions={suggestions} loading={suggestionsLoading} />

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{t('helpdesk.timeline')}</h3>
          <TicketTimeline updates={detail.updates ?? []} />
        </div>

        <LiveSupportChat ticket={detail} onTicketUpdate={(t) => { setDetail(t); onUpdated(t) }} />

        {isManager && (
          <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold">{t('helpdesk.manage')}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-xs text-slate-500">{t('tickets.statusLabel')}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm dark:bg-slate-800"
                >
                  <option value="open">{t('tickets.status.open')}</option>
                  <option value="in_progress">{t('tickets.status.in_progress')}</option>
                  <option value="resolved">{t('tickets.status.resolved')}</option>
                  <option value="closed">{t('tickets.status.closed')}</option>
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveStatus()}
                  className="mt-1 text-xs font-medium text-indigo-600"
                >
                  {t('helpdesk.saveStatus')}
                </button>
              </div>
              <div>
                <label className="text-xs text-slate-500">{t('tickets.assignee')}</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm dark:bg-slate-800"
                >
                  <option value="">{t('tickets.unassigned')}</option>
                  {assignees.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveAssign()}
                  className="mt-1 text-xs font-medium text-indigo-600"
                >
                  {t('helpdesk.saveAssign')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-slate-500">{t('helpdesk.addComment')}</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border px-3 py-2 text-sm dark:bg-slate-800"
          />
          <button
            type="button"
            disabled={busy || !comment.trim()}
            onClick={() => void postComment()}
            className="mt-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {t('helpdesk.postComment')}
          </button>
        </div>
      </div>
    </div>
  )
}
