import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import DepartmentHeatmap from '../components/analytics/DepartmentHeatmap'
import InsightCards from '../components/analytics/InsightCards'
import GenerateReportModal from '../components/reports/GenerateReportModal'
import ReportCharts from '../components/reports/ReportCharts'
import ReportDrillDownModal from '../components/reports/ReportDrillDownModal'
import ReportFiltersBar from '../components/reports/ReportFiltersBar'
import KpiCard from '../components/KpiCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import {
  fetchReportStatistics,
  fetchSavedReports,
  openGenerateReport,
  loadSavedReport,
  setReportFilters,
} from '../store/reportsSlice'
import { formatMoney } from '../utils/currency'
import { advancedAnalyticsApi } from '../services/advancedAnalyticsApi'
import type { AnalyticsInsight, HeatmapRow } from '../types/analyticsInsight'
import {
  exportSavedReportsList,
  exportStatisticsToExcel,
  exportStatisticsToPdf,
} from '../utils/exportReports'

export default function ReportsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { statistics, departments, filters, status, savedReports, savedStatus } = useAppSelector(
    (s) => s.reports,
  )
  const [insights, setInsights] = useState<AnalyticsInsight[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapRow[]>([])
  const [analyticsKpis, setAnalyticsKpis] = useState<{
    reports_generated: number
    insights_available: number
    prediction_accuracy: number
  } | null>(null)
  const [insightsRefreshing, setInsightsRefreshing] = useState(false)

  useEffect(() => {
    dispatch(fetchSavedReports())
    advancedAnalyticsApi.insights().then((res) => setInsights(res.data.data)).catch(() => {})
  }, [dispatch])

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchReportStatistics(filters))
      advancedAnalyticsApi.overview(filters).then((res) => {
        setHeatmap(res.data.data.heatmap)
        setAnalyticsKpis(res.data.data.analytics_kpis)
        if (res.data.data.insights_preview?.length) {
          setInsights((prev) => (prev.length ? prev : res.data.data.insights_preview))
        }
      }).catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [dispatch, filters])

  const handleRefreshInsights = async () => {
    setInsightsRefreshing(true)
    try {
      await advancedAnalyticsApi.refreshInsights()
      const { data } = await advancedAnalyticsApi.insights()
      setInsights(data.data)
    } finally {
      setInsightsRefreshing(false)
    }
  }

  const handleHeatmapDrill = (department: string) => {
    dispatch(setReportFilters({ ...filters, department }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">{t('reports.title')}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 sm:text-base">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statistics && (
            <>
              <button
                type="button"
                onClick={() => exportStatisticsToExcel(statistics)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                {t('reports.exportExcel')}
              </button>
              <button
                type="button"
                onClick={() => exportStatisticsToPdf(statistics, t('reports.title'))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                {t('reports.exportPdf')}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => dispatch(openGenerateReport())}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('reports.generateReport')}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <ReportFiltersBar
          filters={filters}
          departments={departments}
          onChange={(f) => dispatch(setReportFilters(f))}
        />
      </div>

      {analyticsKpis && (
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
          <KpiCard
            label={t('analytics.kpiReportsGenerated')}
            value={analyticsKpis.reports_generated}
            accent="indigo"
          />
          <KpiCard
            label={t('analytics.kpiInsightsAvailable')}
            value={analyticsKpis.insights_available}
            accent="violet"
          />
          <KpiCard
            label={t('analytics.kpiPredictionAccuracy')}
            value={`${Math.round(analyticsKpis.prediction_accuracy * 100)}%`}
            accent="emerald"
          />
        </section>
      )}

      <InsightCards
        insights={insights}
        onRefresh={handleRefreshInsights}
        refreshing={insightsRefreshing}
      />

      {status === 'loading' && !statistics ? (
        <div className="mt-10">
          <LoadingSpinner label={t('reports.loading')} />
        </div>
      ) : statistics ? (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            <KpiCard
              label={t('reports.kpiRequests')}
              value={statistics.kpis.monthly_requests}
              subtext={`${statistics.kpis.requests_trend_percent > 0 ? '+' : ''}${statistics.kpis.requests_trend_percent}%`}
              accent="indigo"
            />
            <KpiCard
              label={t('reports.kpiPayroll')}
              value={formatMoney(statistics.kpis.payroll_cost)}
              accent="violet"
            />
            <KpiCard
              label={t('reports.kpiAttendance')}
              value={`${statistics.kpis.attendance_rate}%`}
              accent="emerald"
            />
            <KpiCard
              label={t('reports.kpiBudget')}
              value={`${statistics.kpis.budget_usage_percent}%`}
              accent="amber"
            />
            {statistics.performance && (
              <KpiCard
                label={t('reports.kpiPerformance')}
                value={statistics.performance.average_score}
                subtext="/ 5"
                accent="indigo"
              />
            )}
          </section>

          {heatmap.length > 0 && (
            <div className="mt-6">
              <DepartmentHeatmap data={heatmap} onDrill={handleHeatmapDrill} />
            </div>
          )}

          <ReportCharts statistics={statistics} />
        </>
      ) : null}

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('reports.savedReports')}</h2>
          {savedReports.length > 0 && (
            <button
              type="button"
              onClick={() => exportSavedReportsList(savedReports)}
              className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {t('reports.exportList')}
            </button>
          )}
        </div>
        {savedStatus === 'loading' ? (
          <LoadingSpinner label={t('common.loading')} />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('reports.reportTitle')}</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 sm:table-cell">{t('reports.type')}</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 md:table-cell">{t('reports.generatedAt')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{t('reports.schedule')}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">{t('reports.view')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {savedReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {t('reports.noSaved')}
                    </td>
                  </tr>
                ) : (
                  savedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{report.title}</td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 sm:table-cell">
                        {t(`reports.modules.${report.type}`)}
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-slate-600 md:table-cell">
                        {new Date(report.generated_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {report.is_scheduled ? (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                            {t(`reports.${report.schedule_frequency}`)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => dispatch(loadSavedReport(report.id))}
                          className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          {t('reports.load')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <GenerateReportModal />
      <ReportDrillDownModal />
    </div>
  )
}
