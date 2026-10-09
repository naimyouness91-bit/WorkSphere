import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { Budget } from '../types/budget'
import type { Expense } from '../types/expense'

export function exportExpensesToExcel(items: Expense[], filename = 'worksphere-expenses.xlsx') {
  const rows = items.map((e) => ({
    Title: e.title,
    Employee: e.employee?.name ?? '',
    Department: e.department,
    Category: e.category,
    Amount: e.amount,
    Date: e.date,
    Status: e.status,
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Expenses')
  XLSX.writeFile(workbook, filename)
}

export function exportExpensesToPdf(items: Expense[], title: string, filename = 'worksphere-expenses.pdf') {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Title', 'Employee', 'Dept', 'Category', 'Amount', 'Date', 'Status']],
    body: items.map((e) => [
      e.title,
      e.employee?.name ?? '',
      e.department,
      e.category,
      e.amount.toFixed(2),
      e.date,
      e.status,
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}

export function exportBudgetsToExcel(items: Budget[], filename = 'worksphere-budgets.xlsx') {
  const rows = items.map((b) => ({
    Department: b.department,
    Period: b.period,
    Year: b.period_year,
    Month: b.period_month ?? '',
    Allocated: b.allocated_amount,
    Spent: b.spent_amount,
    Remaining: b.remaining_amount,
    Usage: `${b.usage_percent}%`,
  }))
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Budgets')
  XLSX.writeFile(workbook, filename)
}

export function exportBudgetsToPdf(items: Budget[], title: string, filename = 'worksphere-budgets.pdf') {
  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  autoTable(doc, {
    startY: 26,
    head: [['Department', 'Period', 'Allocated', 'Spent', 'Remaining', 'Usage %']],
    body: items.map((b) => [
      b.department,
      `${b.period} ${b.period_year}${b.period_month ? `/${b.period_month}` : ''}`,
      b.allocated_amount.toFixed(2),
      b.spent_amount.toFixed(2),
      b.remaining_amount.toFixed(2),
      `${b.usage_percent}%`,
    ]),
    styles: { fontSize: 9 },
  })
  doc.save(filename)
}
