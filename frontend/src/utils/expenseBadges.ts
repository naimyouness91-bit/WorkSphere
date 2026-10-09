import type { ExpenseCategory, ExpenseStatus } from '../types/expense'

export const EXPENSE_STATUS_STYLES: Record<ExpenseStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

export const EXPENSE_CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  hr: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
  it: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
  operations: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  other: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
}
