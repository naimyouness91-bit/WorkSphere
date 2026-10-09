import { useTranslation } from 'react-i18next'
import type { AssetStatus } from '../../types/asset'

const styles: Record<AssetStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  inactive: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
}

export default function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const { t } = useTranslation()

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {t(`assets.status.${status}`)}
    </span>
  )
}
