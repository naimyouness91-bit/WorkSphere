import { useTranslation } from 'react-i18next'
import type { AccountingBudgetRow } from '../../types/accounting'
import { formatMoney } from '../../utils/currency'

interface Props {
  budgets: AccountingBudgetRow[]
}

export default function BudgetOverview({ budgets }: Props) {
  const { t } = useTranslation()

  if (budgets.length === 0) {
    return <p className="text-sm text-slate-500">{t('finance.noBudgets')}</p>
  }

  return (
    <div className="space-y-4">
      {budgets.map((b) => (
        <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{b.department}</h3>
              <p className="text-xs text-slate-500">
                {t('finance.fiscalYear')} {b.period_year} · {formatMoney(b.spent_amount)} / {formatMoney(b.allocated_amount)}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                b.status === 'exceeded'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}
            >
              {t(`finance.budgetStatus.${b.status}`)} · {b.usage_percent}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                b.usage_percent >= 100 ? 'bg-red-500' : b.usage_percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, b.usage_percent)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
