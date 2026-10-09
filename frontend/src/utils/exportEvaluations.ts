import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Evaluation } from '../types/evaluation'

function rowFromEvaluation(e: Evaluation) {
  return {
    Employee: e.employee?.name ?? '',
    Evaluator: e.evaluator?.name ?? '',
    Period: e.review_period,
    Score: e.score,
    Status: e.status,
    Comments: e.comments ?? '',
  }
}

export function exportEvaluationsToExcel(
  evaluations: Evaluation[],
  filename = 'worksphere-evaluations.xlsx',
) {
  const sheet = XLSX.utils.json_to_sheet(evaluations.map(rowFromEvaluation))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Evaluations')
  XLSX.writeFile(workbook, filename)
}

export function exportEvaluationsToPdf(
  evaluations: Evaluation[],
  title: string,
  filename = 'worksphere-evaluations.pdf',
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Employee', 'Evaluator', 'Period', 'Score', 'Status']],
    body: evaluations.map((e) => [
      e.employee?.name ?? '',
      e.evaluator?.name ?? '',
      e.review_period,
      e.score.toFixed(2),
      e.status,
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}
