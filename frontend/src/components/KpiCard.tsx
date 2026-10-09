interface KpiCardProps {
  label: string
  value: string | number
  subtext?: string
  accent?: 'indigo' | 'emerald' | 'amber' | 'violet' | 'rose' | 'cyan' | 'orange'
}

const borderAccent = {
  indigo: 'border-indigo-100 dark:border-indigo-900/50',
  emerald: 'border-emerald-100 dark:border-emerald-900/50',
  amber: 'border-amber-100 dark:border-amber-900/50',
  violet: 'border-violet-100 dark:border-violet-900/50',
  rose: 'border-rose-100 dark:border-rose-900/50',
  cyan: 'border-cyan-100 dark:border-cyan-900/50',
  orange: 'border-orange-100 dark:border-orange-900/50',
}

const valueAccent = {
  indigo: 'text-indigo-700 dark:text-indigo-300',
  emerald: 'text-emerald-700 dark:text-emerald-300',
  amber: 'text-amber-700 dark:text-amber-300',
  violet: 'text-violet-700 dark:text-violet-300',
  rose: 'text-rose-700 dark:text-rose-300',
  cyan: 'text-cyan-700 dark:text-cyan-300',
  orange: 'text-orange-700 dark:text-orange-300',
}

export default function KpiCard({
  label,
  value,
  subtext,
  accent = 'indigo',
}: KpiCardProps) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 ${borderAccent[accent]}`}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${valueAccent[accent]}`}>{value}</p>
      {subtext && (
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{subtext}</p>
      )}
    </div>
  )
}
