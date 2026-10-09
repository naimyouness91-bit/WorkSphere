import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { DrillDownItem, ReportStatistics, SavedReport } from '../types/report'

export function exportStatisticsToExcel(stats: ReportStatistics, filename = 'worksphere-report.xlsx') {
  const workbook = XLSX.utils.book_new()

  const kpiSheet = XLSX.utils.json_to_sheet([
    { Metric: 'Monthly requests', Value: stats.kpis.monthly_requests },
    { Metric: 'Requests trend %', Value: stats.kpis.requests_trend_percent },
    { Metric: 'Payroll cost', Value: stats.kpis.payroll_cost },
    { Metric: 'Attendance rate %', Value: stats.kpis.attendance_rate },
    { Metric: 'Budget usage %', Value: stats.kpis.budget_usage_percent },
  ])
  XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs')

  if (stats.requests?.by_status) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(stats.requests.by_status),
      'Requests status',
    )
  }
  if (stats.payroll?.evolution) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(stats.payroll.evolution),
      'Payroll',
    )
  }
  if (stats.finance?.expenses_by_category) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(stats.finance.expenses_by_category),
      'Finance',
    )
  }

  XLSX.writeFile(workbook, filename)
}

export function exportStatisticsToPdf(
  stats: ReportStatistics,
  title: string,
  filename = 'worksphere-report.pdf',
) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(11)
  doc.text(`Period: ${stats.filters.date_from} — ${stats.filters.date_to}`, 14, 28)

  autoTable(doc, {
    startY: 36,
    head: [['KPI', 'Value']],
    body: [
      ['Monthly requests', String(stats.kpis.monthly_requests)],
      ['Requests trend', `${stats.kpis.requests_trend_percent}%`],
      ['Payroll cost', String(stats.kpis.payroll_cost)],
      ['Attendance rate', `${stats.kpis.attendance_rate}%`],
      ['Budget usage', `${stats.kpis.budget_usage_percent}%`],
    ],
    styles: { fontSize: 10 },
  })

  if (stats.requests?.by_status?.length) {
    autoTable(doc, {
      startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
      head: [['Request status', 'Count']],
      body: stats.requests.by_status.map((r) => [r.status, r.count]),
      styles: { fontSize: 9 },
    })
  }

  doc.save(filename)
}

export function exportDrillDownToExcel(items: DrillDownItem[], filename = 'worksphere-drilldown.xlsx') {
  const sheet = XLSX.utils.json_to_sheet(items)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Details')
  XLSX.writeFile(workbook, filename)
}

export function exportSavedReportsList(reports: SavedReport[], filename = 'worksphere-reports-list.xlsx') {
  const rows = reports.map((r) => ({
    Title: r.title,
    Type: r.type,
    Generated: r.generated_at,
    From: r.date_from ?? '',
    To: r.date_to ?? '',
    Department: r.department ?? '',
    Scheduled: r.is_scheduled ? r.schedule_frequency : '',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Reports')
  XLSX.writeFile(workbook, filename)
}
