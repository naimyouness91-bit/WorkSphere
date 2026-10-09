import { useTranslation } from 'react-i18next'
import type { RequestStatus } from '../types/internalRequest'

const styles: Record<RequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 ring-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  rejected: 'bg-red-100 text-red-800 ring-red-200',
}

interface StatusBadgeProps {
  status: RequestStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  )
}
