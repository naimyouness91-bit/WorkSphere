import { useTranslation } from 'react-i18next'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const { t } = useTranslation()
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      {t('offline.banner')}
    </div>
  )
}
