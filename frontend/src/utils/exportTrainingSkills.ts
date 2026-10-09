import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Skill } from '../types/skill'
import type { Training } from '../types/training'

export function exportTrainingsToExcel(
  trainings: Training[],
  filename = 'worksphere-trainings.xlsx',
) {
  const rows = trainings.map((t) => ({
    Title: t.title,
    Trainer: t.trainer?.name ?? '',
    Status: t.status,
    Start: t.start_date,
    End: t.end_date,
    Assignees: t.assignees?.map((a) => a.name).join(', ') ?? '',
    Description: t.description ?? '',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Trainings')
  XLSX.writeFile(workbook, filename)
}

export function exportSkillsToExcel(skills: Skill[], filename = 'worksphere-skills.xlsx') {
  const rows = skills.map((s) => ({
    Skill: s.name,
    Employee: s.employee?.name ?? '',
    Level: s.level,
    Description: s.description ?? '',
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Skills')
  XLSX.writeFile(workbook, filename)
}

export function exportTrainingsToPdf(
  trainings: Training[],
  title: string,
  filename = 'worksphere-trainings.pdf',
) {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Title', 'Trainer', 'Status', 'Start', 'End', 'Assignees']],
    body: trainings.map((t) => [
      t.title,
      t.trainer?.name ?? '',
      t.status,
      t.start_date.slice(0, 10),
      t.end_date.slice(0, 10),
      t.assignees?.map((a) => a.name).join(', ') ?? '',
    ]),
    styles: { fontSize: 8 },
  })
  doc.save(filename)
}

export function exportSkillsToPdf(
  skills: Skill[],
  title: string,
  filename = 'worksphere-skills.pdf',
) {
  const doc = new jsPDF()
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Skill', 'Employee', 'Level', 'Description']],
    body: skills.map((s) => [
      s.name,
      s.employee?.name ?? '',
      s.level,
      (s.description ?? '').slice(0, 80),
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}
