import { useTranslation } from 'react-i18next'
import type { PurchaseOrder, PurchaseOrderStatus } from '../../types/inventory'

const STAGES: PurchaseOrderStatus[] = ['pending', 'approved', 'delivered']

const STAGE_STYLES: Record<PurchaseOrderStatus, string> = {
  pending: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
  approved: 'border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/30',
  delivered: 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
}

interface Props {
  orders: PurchaseOrder[]
  canManage: boolean
  onStatusChange: (id: number, status: PurchaseOrderStatus) => void
}

export default function PoPipeline({ orders, canManage, onStatusChange }: Props) {
  const { t } = useTranslation()
  const byStatus = (s: PurchaseOrderStatus) => orders.filter((o) => o.status === s)

  const formatMoney = (v: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {STAGES.map((stage) => (
        <div key={stage} className={`rounded-xl border-2 p-3 ${STAGE_STYLES[stage]}`}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
            {t(`inventory.poStatus.${stage}`)}
            <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs dark:bg-slate-900/50">
              {byStatus(stage).length}
            </span>
          </h3>
          <ul className="space-y-2">
            {byStatus(stage).map((po) => (
              <li
                key={po.id}
                className="rounded-lg border border-white/60 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{po.po_number}</p>
                <p className="text-xs text-slate-500">{po.supplier?.name}</p>
                <p className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-400">
                  {formatMoney(po.total_amount)}
                </p>
                {canManage && (
                  <select
                    value={po.status}
                    onChange={(e) => onStatusChange(po.id, e.target.value as PurchaseOrderStatus)}
                    className="mt-2 w-full rounded border px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-800"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {t(`inventory.poStatus.${s}`)}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            ))}
            {byStatus(stage).length === 0 && (
              <li className="text-xs text-slate-500">{t('inventory.noPos')}</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  )
}
