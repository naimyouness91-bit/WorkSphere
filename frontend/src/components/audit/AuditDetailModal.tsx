import { useTranslation } from 'react-i18next'
import LoadingSpinner from '../LoadingSpinner'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { closeAuditLogDetail } from '../../store/auditLogsSlice'

function formatTimestamp(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale)
}

export default function AuditDetailModal() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const { isDetailOpen, selectedLog, detailStatus } = useAppSelector((s) => s.auditLogs)

  if (!isDetailOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('audit.detailTitle')}</h2>
          <button
            type="button"
            onClick={() => dispatch(closeAuditLogDetail())}
            className="text-slate-400 hover:text-slate-600"
            aria-label={t('common.cancel')}
          >
            ×
          </button>
        </div>

        {detailStatus === 'loading' && !selectedLog ? (
          <div className="mt-6">
            <LoadingSpinner label={t('common.loading')} />
          </div>
        ) : selectedLog ? (
          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-slate-500">{t('audit.timestamp')}</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {formatTimestamp(selectedLog.timestamp, i18n.language)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{t('audit.user')}</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {selectedLog.user?.name ?? t('audit.systemUser')}
                {selectedLog.user?.email ? ` (${selectedLog.user.email})` : ''}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{t('audit.action')}</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {t(`audit.actions.${selectedLog.action}`, selectedLog.action)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{t('audit.module')}</dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {t(`audit.modules.${selectedLog.module}`, selectedLog.module)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{t('audit.ipAddress')}</dt>
              <dd className="font-mono text-slate-900 dark:text-slate-100">{selectedLog.ip_address ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{t('audit.description')}</dt>
              <dd className="whitespace-pre-wrap text-slate-900 dark:text-slate-100">{selectedLog.description}</dd>
            </div>
          </dl>
        ) : null}
      </div>
    </div>
  )
}
