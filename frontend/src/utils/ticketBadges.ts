import type { TicketPriority, TicketStatus } from '../types/ticket'

export const TICKET_STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  closed: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

export const TICKET_PRIORITY_STYLES: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  medium: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

export const TICKET_CATEGORY_STYLES: Record<string, string> = {
  it: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  hr: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  finance: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}
