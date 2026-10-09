import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Attendance } from '../types/attendance'
import type { Leave } from '../types/leave'

export function exportAttendanceToExcel(items: Attendance[], filename = 'worksphere-attendance.xlsx') {
  const rows = items.map((a) => ({
    Employee: a.employee?.name ?? '',
    Date: a.date,
    CheckIn: a.check_in_time?.slice(11, 16) ?? '',
    CheckOut: a.check_out_time?.slice(11, 16) ?? '',
    Status: a.status,
    Hours: a.working_hours,
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Attendance')
  XLSX.writeFile(workbook, filename)
}

export function exportAttendanceToPdf(items: Attendance[], title: string, filename = 'worksphere-attendance.pdf') {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Employee', 'Date', 'Check in', 'Check out', 'Status', 'Hours']],
    body: items.map((a) => [
      a.employee?.name ?? '',
      a.date,
      a.check_in_time?.slice(11, 16) ?? '—',
      a.check_out_time?.slice(11, 16) ?? '—',
      a.status,
      a.working_hours.toFixed(2),
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}

export function exportLeavesToExcel(items: Leave[], filename = 'worksphere-leaves.xlsx') {
  const rows = items.map((l) => ({
    Employee: l.employee?.name ?? '',
    Type: l.leave_type,
    Start: l.start_date,
    End: l.end_date,
    Days: l.day_count,
    Status: l.status,
    Reason: l.reason ?? '',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Leaves')
  XLSX.writeFile(workbook, filename)
}

export function exportLeavesToPdf(items: Leave[], title: string, filename = 'worksphere-leaves.pdf') {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Employee', 'Type', 'Start', 'End', 'Days', 'Status']],
    body: items.map((l) => [
      l.employee?.name ?? '',
      l.leave_type,
      l.start_date,
      l.end_date,
      l.day_count,
      l.status,
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}
