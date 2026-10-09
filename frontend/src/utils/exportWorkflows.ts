import * as XLSX from 'xlsx'
import type { Workflow } from '../types/settings'

export function downloadWorkflowsJson(
  payload: { exported_at: string; workflows: Workflow[] },
  filename?: string,
) {
  const name = filename ?? `worksphere-workflows-${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export function exportWorkflowsToExcel(workflows: Workflow[], filename?: string) {
  const rows = workflows.flatMap((w) =>
    w.steps.map((step) => ({
      workflow_id: w.id,
      title: w.title,
      domain: w.domain,
      step_order: step.order,
      step_name: step.name,
      approver_role: step.approver_role ?? '',
      assigned_roles: (w.assigned_roles ?? []).join(', '),
      is_active: w.is_active ? 'yes' : 'no',
    })),
  )

  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Workflows')
  XLSX.writeFile(workbook, filename ?? `worksphere-workflows-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
