import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Ticket } from '../types/ticket'

function rowFromTicket(t: Ticket) {
  return {
    Title: t.title,
    Employee: t.employee?.name ?? '',
    Category: t.category,
    Priority: t.priority,
    Status: t.status,
    Assignee: t.assignee?.name ?? '',
    Created: t.created_at?.slice(0, 10) ?? '',
    Resolved: t.resolved_at?.slice(0, 10) ?? '',
  }
}

export function exportTicketsToExcel(tickets: Ticket[], filename = 'worksphere-tickets.xlsx') {
  const sheet = XLSX.utils.json_to_sheet(tickets.map(rowFromTicket))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tickets')
  XLSX.writeFile(workbook, filename)
}

export function exportTicketsToPdf(
  tickets: Ticket[],
  title: string,
  filename = 'worksphere-tickets.pdf',
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Title', 'Employee', 'Category', 'Priority', 'Status', 'Assignee']],
    body: tickets.map((t) => [
      t.title,
      t.employee?.name ?? '',
      t.category,
      t.priority,
      t.status,
      t.assignee?.name ?? '',
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}
