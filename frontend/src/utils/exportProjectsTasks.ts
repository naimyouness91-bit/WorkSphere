import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Project } from '../types/project'
import type { Task } from '../types/task'

export function exportProjectsToExcel(projects: Project[], filename = 'worksphere-projects.xlsx') {
  const rows = projects.map((p) => ({
    Title: p.title,
    Manager: p.manager?.name ?? '',
    Status: p.status,
    Progress: `${p.progress_percent}%`,
    Start: p.start_date,
    End: p.end_date,
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Projects')
  XLSX.writeFile(workbook, filename)
}

export function exportProjectsToPdf(
  projects: Project[],
  title: string,
  filename = 'worksphere-projects.pdf',
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Title', 'Manager', 'Status', 'Progress', 'Start', 'End']],
    body: projects.map((p) => [
      p.title,
      p.manager?.name ?? '',
      p.status,
      `${p.progress_percent}%`,
      p.start_date,
      p.end_date,
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}

export function exportTasksToExcel(tasks: Task[], filename = 'worksphere-tasks.xlsx') {
  const rows = tasks.map((t) => ({
    Project: t.project?.title ?? '',
    Title: t.title,
    Assignee: t.assignee?.name ?? '',
    Status: t.status,
    Due: t.due_date ?? '',
    Overdue: t.is_overdue ? 'Yes' : 'No',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tasks')
  XLSX.writeFile(workbook, filename)
}

export function exportTasksToPdf(tasks: Task[], title: string, filename = 'worksphere-tasks.pdf') {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Project', 'Title', 'Assignee', 'Status', 'Due']],
    body: tasks.map((t) => [
      t.project?.title ?? '',
      t.title,
      t.assignee?.name ?? '',
      t.status,
      t.due_date ?? '',
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}
