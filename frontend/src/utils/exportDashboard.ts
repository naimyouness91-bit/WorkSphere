import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { AdminAnalytics } from '../types/adminDashboard'
import type { InternalRequest } from '../types/internalRequest'

export function exportRequestsToExcel(
  requests: InternalRequest[],
  filename = 'worksphere-requests.xlsx',
) {
  const rows = requests.map((r) => ({
    Title: r.title,
    Employee: r.employee?.name ?? '',
    Email: r.employee?.email ?? '',
    Type: r.type,
    Status: r.status,
    Submitted: r.created_at,
    Description: r.description,
  }))

  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Requests')
  XLSX.writeFile(workbook, filename)
}

export function exportStatsToExcel(
  analytics: AdminAnalytics,
  filename = 'worksphere-statistics.xlsx',
) {
  const kpiSheet = XLSX.utils.json_to_sheet([
    { Metric: 'Total employees', Value: analytics.kpis.total_employees },
    { Metric: 'Total requests', Value: analytics.kpis.total_requests },
    { Metric: 'Acceptance rate (%)', Value: analytics.kpis.acceptance_rate },
    {
      Metric: 'Avg approval time (hours)',
      Value: analytics.extended_kpis.avg_approval_time_hours,
    },
    { Metric: 'Rejection rate (%)', Value: analytics.extended_kpis.rejection_rate },
    {
      Metric: 'Active managers',
      Value: `${analytics.extended_kpis.active_managers} / ${analytics.extended_kpis.total_managers}`,
    },
  ])

  const statusSheet = XLSX.utils.json_to_sheet(
    analytics.requests_by_status.map((s) => ({
      Status: s.status,
      Count: s.count,
    })),
  )

  const typeSheet = XLSX.utils.json_to_sheet(
    analytics.requests_by_type.map((t) => ({
      Type: t.type,
      Count: t.count,
    })),
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs')
  XLSX.utils.book_append_sheet(workbook, statusSheet, 'By status')
  XLSX.utils.book_append_sheet(workbook, typeSheet, 'By type')
  XLSX.writeFile(workbook, filename)
}

export function exportRequestsToPdf(
  requests: InternalRequest[],
  title: string,
  filename = 'worksphere-requests.pdf',
) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26)

  autoTable(doc, {
    startY: 32,
    head: [['Title', 'Employee', 'Type', 'Status', 'Date']],
    body: requests.map((r) => [
      r.title,
      r.employee?.name ?? '—',
      r.type,
      r.status,
      new Date(r.created_at).toLocaleDateString(),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  })

  doc.save(filename)
}

export function exportStatsToPdf(
  analytics: AdminAnalytics,
  title: string,
  filename = 'worksphere-statistics.pdf',
) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26)

  autoTable(doc, {
    startY: 32,
    head: [['Metric', 'Value']],
    body: [
      ['Total employees', String(analytics.kpis.total_employees)],
      ['Total requests', String(analytics.kpis.total_requests)],
      ['Acceptance rate', `${analytics.kpis.acceptance_rate}%`],
      ['Avg approval time', `${analytics.extended_kpis.avg_approval_time_hours} h`],
      ['Rejection rate', `${analytics.extended_kpis.rejection_rate}%`],
      [
        'Active managers',
        `${analytics.extended_kpis.active_managers} / ${analytics.extended_kpis.total_managers}`,
      ],
    ],
    headStyles: { fillColor: [79, 70, 229] },
  })

  doc.save(filename)
}
