import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface ExportPlan {
  project: {
    title: string
    description?: string | null
    manager?: string
    status: string
    start_date: string
    end_date: string
    progress_percent: number
  }
  tasks: Array<{ title: string; status: string; assignee?: string; due_date?: string }>
  milestones: Array<{ title: string; target_date: string; status: string }>
}

export function exportPlanToExcel(plan: ExportPlan, filename?: string) {
  const name = filename ?? `worksphere-${plan.project.title}-plan.xlsx`
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet([
      { Field: 'Title', Value: plan.project.title },
      { Field: 'Manager', Value: plan.project.manager ?? '' },
      { Field: 'Status', Value: plan.project.status },
      { Field: 'Progress', Value: `${plan.project.progress_percent}%` },
      { Field: 'Start', Value: plan.project.start_date },
      { Field: 'End', Value: plan.project.end_date },
    ]),
    'Project',
  )
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(plan.tasks), 'Tasks')
  XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(plan.milestones), 'Milestones')
  XLSX.writeFile(book, name)
}

export function exportPlanToPdf(plan: ExportPlan, title: string, filename?: string) {
  const name = filename ?? `worksphere-${plan.project.title}-plan.pdf`
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(11)
  doc.text(`${plan.project.title} · ${plan.project.progress_percent}% · ${plan.project.status}`, 14, 28)
  autoTable(doc, {
    startY: 36,
    head: [['Task', 'Status', 'Assignee', 'Due']],
    body: plan.tasks.map((t) => [t.title, t.status, t.assignee ?? '', t.due_date ?? '']),
  })
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 40
  autoTable(doc, {
    startY: finalY + 10,
    head: [['Milestone', 'Target', 'Status']],
    body: plan.milestones.map((m) => [m.title, m.target_date, m.status]),
  })
  doc.save(name)
}
