import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { AuditLog } from '../types/auditLog'

export function exportAuditLogsToExcel(items: AuditLog[], filename = 'worksphere-audit-logs.xlsx') {
  const rows = items.map((log) => ({
    Timestamp: log.timestamp,
    User: log.user?.name ?? 'System',
    Email: log.user?.email ?? '',
    Action: log.action,
    Module: log.module,
    Description: log.description,
    IP: log.ip_address ?? '',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Audit Logs')
  XLSX.writeFile(workbook, filename)
}

export function exportAuditLogsToPdf(
  items: AuditLog[],
  title: string,
  filename = 'worksphere-audit-logs.pdf',
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Time', 'User', 'Action', 'Module', 'Description', 'IP']],
    body: items.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.user?.name ?? '—',
      log.action,
      log.module,
      log.description.length > 80 ? `${log.description.slice(0, 77)}...` : log.description,
      log.ip_address ?? '—',
    ]),
    styles: { fontSize: 8 },
  })
  doc.save(filename)
}
