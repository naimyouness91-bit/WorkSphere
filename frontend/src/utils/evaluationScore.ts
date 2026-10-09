export function scoreColorClass(score: number): string {
  if (score >= 4) {
    return 'text-emerald-700 dark:text-emerald-300'
  }
  if (score >= 3) {
    return 'text-amber-700 dark:text-amber-300'
  }
  return 'text-red-600 dark:text-red-400'
}

export function scoreBarPercent(score: number): number {
  return Math.min(100, Math.max(0, (score / 5) * 100))
}

export function scoreBarColor(score: number): string {
  if (score >= 4) return 'bg-emerald-500'
  if (score >= 3) return 'bg-amber-500'
  return 'bg-red-500'
}

export const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  submitted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  finalized: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
}
