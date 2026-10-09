import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { PayrollRecord } from '../types/payroll'

function rowFromRecord(r: PayrollRecord) {
  return {
    Employee: r.employee?.name ?? '',
    Department: r.employee?.department ?? '',
    'Base salary': r.base_salary,
    Bonuses: r.bonuses,
    Deductions: r.deductions,
    'Net salary': r.net_salary,
    'Pay date': r.pay_date,
  }
}

export function exportPayrollToExcel(
  records: PayrollRecord[],
  filename = 'worksphere-payroll.xlsx',
) {
  const rows = records.map(rowFromRecord)
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Payroll')
  XLSX.writeFile(workbook, filename)
}

export function exportPayrollToPdf(
  records: PayrollRecord[],
  title: string,
  filename = 'worksphere-payroll.pdf',
) {
  const doc = new jsPDF({ orientation: records.length > 4 ? 'landscape' : 'portrait' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26)
  doc.text('Confidential — authorized personnel only', 14, 32)

  autoTable(doc, {
    startY: 38,
    head: [['Employee', 'Base', 'Bonuses', 'Deductions', 'Net', 'Pay date']],
    body: records.map((r) => [
      r.employee?.name ?? '',
      r.base_salary.toFixed(2),
      r.bonuses.toFixed(2),
      r.deductions.toFixed(2),
      r.net_salary.toFixed(2),
      r.pay_date,
    ]),
    styles: { fontSize: 9 },
  })

  doc.save(filename)
}
