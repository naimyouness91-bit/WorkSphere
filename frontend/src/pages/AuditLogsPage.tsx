import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import AuditDetailModal from '../components/audit/AuditDetailModal'
import AuditFiltersBar from '../components/audit/AuditFiltersBar'
import SecurityAlertsPanel from '../components/audit/SecurityAlertsPanel'
import PersistentAlertsPanel from '../components/security/PersistentAlertsPanel'
import RolePermissionManager from '../components/security/RolePermissionManager'
import SecurityCharts from '../components/security/SecurityCharts'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { securityApi } from '../services/securityApi'
import { usersApi } from '../services/usersApi'
import {
  fetchAuditLogDetail,
  fetchAuditLogs,
  fetchAuditSummary,
  openAuditLogDetail,
  setAuditLogFilters,
  setAuditLogPage,
} from '../store/auditLogsSlice'
import type { SecurityOverview } from '../types/security'
import type { AppUser } from '../types/userList'
import type { AuditLog } from '../types/auditLog'
import { exportAuditLogsToExcel, exportAuditLogsToPdf } from '../utils/exportAuditLogs'
import * as XLSX from 'xlsx'

type Tab = 'overview' | 'logs' | 'permissions' | 'alerts'

const ACTION_STYLES: Record<string, string> = {
  login: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  logout: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  login_failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  forbidden: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  create: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  update: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

const TABS: Tab[] = ['overview', 'logs', 'permissions', 'alerts']

export default function AuditLogsPage() {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const { items, status, filters, page, lastPage, total, summary } = useAppSelector((s) => s.auditLogs)
  const [users, setUsers] = useState<AppUser[]>([])
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<SecurityOverview | null>(null)

  useEffect(() => {
    usersApi.index().then((res) => setUsers(res.data.data))
    dispatch(fetchAuditSummary())
    securityApi.overview().then((res) => setOverview(res.data.data)).catch(() => {})
  }, [dispatch])

  useEffect(() => {
    if (tab !== 'logs') return
    const timer = setTimeout(
      () => dispatch(fetchAuditLogs({ filters, page })),
      250,
    )
    return () => clearTimeout(timer)
  }, [dispatch, filters, page, tab])

  const handleViewDetail = (log: AuditLog) => {
    dispatch(openAuditLogDetail(log))
    dispatch(fetchAuditLogDetail(log.id))
  }

  const handleExportAll = async () => {
    try {
      const { data } = await securityApi.export(filters)
      const sheet = XLSX.utils.json_to_sheet(data.data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, 'Audit Logs')
      XLSX.writeFile(workbook, 'worksphere-audit-export.xlsx')
    } catch {
      exportAuditLogsToExcel(items)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language, {
      dateStyle: 'short',
      timeStyle: 'short',
    })

  const securityKpis = overview?.security_kpis

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{t('security.title')}</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{t('security.subtitle')}</p>
        </div>
        {tab === 'logs' && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportAll}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              {t('audit.exportExcel')}
            </button>
            <button
              type="button"
              onClick={() => exportAuditLogsToPdf(items, t('security.title'))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              {t('audit.exportPdf')}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === key
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t(`security.tab.${key}`)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label={t('security.kpiActiveAlerts')}
              value={securityKpis?.active_alerts ?? '—'}
              accent="rose"
            />
            <KpiCard
              label={t('security.kpiFailedLogins')}
              value={securityKpis?.failed_logins_24h ?? '—'}
              accent="amber"
            />
            <KpiCard
              label={t('security.kpiUnauthorized')}
              value={securityKpis?.unauthorized_attempts_24h ?? '—'}
              accent="orange"
            />
            <KpiCard
              label={t('audit.kpiToday')}
              value={overview?.kpis.actions_logged_today ?? summary?.kpis.actions_logged_today ?? '—'}
              accent="indigo"
            />
          </section>

          {overview && (
            <>
              <SecurityCharts overview={overview} />
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
                <span className="font-medium text-slate-700 dark:text-slate-300">{t('security.integrity')}:</span>{' '}
                {overview.integrity.valid ? (
                  <span className="text-emerald-600 dark:text-emerald-400">{t('security.integrityValid')}</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    {t('security.integrityBroken', { id: overview.integrity.broken_at_id })}
                  </span>
                )}
                <span className="ml-2 text-slate-500">
                  ({t('security.integrityChecked', { count: overview.integrity.checked })})
                </span>
              </div>
            </>
          )}

          {summary && <SecurityAlertsPanel alerts={summary.alerts} />}
        </>
      )}

      {tab === 'logs' && (
        <>
          <div className="mt-6">
            <AuditFiltersBar
              filters={filters}
              users={users}
              onChange={(f) => dispatch(setAuditLogFilters(f))}
            />
          </div>

          {status === 'loading' && items.length === 0 ? (
            <div className="mt-8">
              <LoadingSpinner label={t('common.loading')} />
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm text-slate-500">
                {t('audit.totalRecords', { count: total })}
              </p>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('audit.timestamp')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('audit.user')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('audit.action')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('audit.module')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('audit.description')}</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">{t('audit.view')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">{t('audit.empty')}</td>
                      </tr>
                    ) : (
                      items.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatTime(log.timestamp)}</td>
                          <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{log.user?.name ?? t('audit.systemUser')}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[log.action] ?? 'bg-slate-100 text-slate-700'}`}>
                              {t(`audit.actions.${log.action}`, log.action)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{t(`audit.modules.${log.module}`, log.module)}</td>
                          <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{log.description}</td>
                          <td className="px-4 py-3 text-right">
                            <button type="button" onClick={() => handleViewDetail(log)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                              {t('audit.view')}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {lastPage > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => dispatch(setAuditLogPage(page - 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600">
                    {t('audit.prevPage')}
                  </button>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{t('audit.pageOf', { page, total: lastPage })}</span>
                  <button type="button" disabled={page >= lastPage} onClick={() => dispatch(setAuditLogPage(page + 1))} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600">
                    {t('audit.nextPage')}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'permissions' && (
        <div className="mt-6">
          <RolePermissionManager />
        </div>
      )}

      {tab === 'alerts' && (
        <div className="mt-6">
          <PersistentAlertsPanel />
        </div>
      )}

      <AuditDetailModal />
    </div>
  )
}
