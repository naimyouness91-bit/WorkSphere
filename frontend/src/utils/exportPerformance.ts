import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { PerformanceReport } from '../types/performance'

export function exportPerformanceToExcel(report: PerformanceReport, filename?: string) {
  const name = filename ?? `worksphere-performance-${report.employee.name.replace(/\s+/g, '-')}.xlsx`
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Metric: 'Performance score', Value: report.score.score },
      { Metric: 'Goals achieved', Value: report.score.breakdown.goals_achieved },
      { Metric: 'Avg review rating', Value: report.score.breakdown.avg_review_rating },
      { Metric: 'Avg 360 rating', Value: report.score.breakdown.avg_feedback_rating },
    ]),
    'Summary',
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      report.goals.map((g) => ({
        Title: g.title,
        Status: g.status,
        Progress: g.progress,
        Target: g.target_date,
      })),
    ),
    'Goals',
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      report.reviews.map((r) => ({
        Reviewer: r.reviewer?.name ?? '',
        Rating: r.rating,
        Date: r.review_date,
        Comments: r.comments ?? '',
      })),
    ),
    'Reviews',
  )

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      report.feedback.map((f) => ({
        From: f.is_anonymous ? 'Anonymous' : (f.from_user?.name ?? ''),
        Rating: f.rating,
        Date: f.feedback_date,
        Feedback: f.feedback_text,
      })),
    ),
    '360 Feedback',
  )

  XLSX.writeFile(wb, name)
}

export function exportPerformanceToPdf(report: PerformanceReport, title: string, filename?: string) {
  const name = filename ?? `worksphere-performance-${report.employee.name.replace(/\s+/g, '-')}.pdf`
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(11)
  doc.text(`Employee: ${report.employee.name}`, 14, 28)
  doc.text(`Overall score: ${report.score.score}/100`, 14, 36)

  autoTable(doc, {
    startY: 44,
    head: [['Goals', 'Status', 'Progress', 'Target']],
    body: report.goals.map((g) => [g.title, g.status, `${g.progress}%`, g.target_date]),
    styles: { fontSize: 9 },
  })

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80

  autoTable(doc, {
    startY: finalY + 10,
    head: [['Reviewer', 'Rating', 'Date']],
    body: report.reviews.map((r) => [
      r.reviewer?.name ?? '—',
      r.rating.toFixed(1),
      r.review_date,
    ]),
    styles: { fontSize: 9 },
  })

  doc.save(name)
}
