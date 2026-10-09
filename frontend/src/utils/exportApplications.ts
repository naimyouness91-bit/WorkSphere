import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Application } from '../types/application'

function rowFromApplication(a: Application) {
  return {
    Candidate: a.candidate_name,
    Email: a.candidate_email,
    Job: a.job?.title ?? '',
    Department: a.job?.department ?? '',
    Status: a.status,
    Resume: a.original_resume_filename,
    Applied: a.created_at ?? '',
  }
}

export function exportApplicationsToExcel(
  applications: Application[],
  filename = 'worksphere-applications.xlsx',
) {
  const sheet = XLSX.utils.json_to_sheet(applications.map(rowFromApplication))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Applications')
  XLSX.writeFile(workbook, filename)
}

export function exportApplicationsToPdf(
  applications: Application[],
  title: string,
  filename = 'worksphere-applications.pdf',
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Candidate', 'Email', 'Job', 'Department', 'Status', 'Applied']],
    body: applications.map((a) => [
      a.candidate_name,
      a.candidate_email,
      a.job?.title ?? '',
      a.job?.department ?? '',
      a.status,
      a.created_at ? a.created_at.slice(0, 10) : '',
    ]),
    styles: { fontSize: 8 },
  })
  doc.save(filename)
}
