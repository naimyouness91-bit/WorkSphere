import { useTranslation } from 'react-i18next'
import type { FinancialTransaction } from '../../types/accounting'
import { formatMoney } from '../../utils/currency'

interface Props {
  transactions: FinancialTransaction[]
}

export default function TransactionTable({ transactions }: Props) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-xl border dark:border-slate-700">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          <tr>
            <th className="px-4 py-3 text-start">{t('finance.date')}</th>
            <th className="px-4 py-3">{t('finance.txType')}</th>
            <th className="px-4 py-3 text-end">{t('finance.amount')}</th>
            <th className="px-4 py-3 text-start">{t('finance.reference')}</th>
            <th className="px-4 py-3 text-start">{t('finance.description')}</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-slate-800">
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="px-4 py-3">{tx.transaction_date}</td>
              <td className="px-4 py-3 text-center">
                <span className={tx.type === 'income' ? 'text-emerald-600' : 'text-indigo-600'}>
                  {t(`finance.txTypes.${tx.type}`)}
                </span>
              </td>
              <td className="px-4 py-3 text-end font-medium">{formatMoney(tx.amount)}</td>
              <td className="px-4 py-3 font-mono text-xs">{tx.reference}</td>
              <td className="px-4 py-3 text-slate-500">{tx.description ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 && (
        <p className="py-8 text-center text-slate-500">{t('finance.noTransactions')}</p>
      )}
    </div>
  )
}
