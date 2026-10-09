import * as XLSX from 'xlsx'

export interface ExportCandidateRow {
  id: number
  name: string
  email: string
  status: string
  job_title?: string
  department?: string
  applied_at?: string
}

export function exportCandidatesToExcel(
  rows: ExportCandidateRow[],
  filename = 'worksphere-candidates.xlsx',
) {
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      ID: r.id,
      Name: r.name,
      Email: r.email,
      Status: r.status,
      Job: r.job_title ?? '',
      Department: r.department ?? '',
      Applied: r.applied_at ?? '',
    })),
  )
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Candidates')
  XLSX.writeFile(wb, filename)
}

export function exportCandidatesToCsv(
  rows: ExportCandidateRow[],
  filename = 'worksphere-candidates.csv',
) {
  const sheet = XLSX.utils.json_to_sheet(
    rows.map((r) => ({
      Name: r.name,
      Email: r.email,
      Status: r.status,
      Job: r.job_title ?? '',
      Department: r.department ?? '',
    })),
  )
  const csv = XLSX.utils.sheet_to_csv(sheet)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
