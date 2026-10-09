import * as XLSX from 'xlsx'

export function downloadIntegrationsBackup(data: unknown[], exportedAt: string) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          exported_at: exportedAt,
          integrations: data,
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `worksphere-integrations-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportIntegrationLogsToExcel(
  rows: Record<string, unknown>[],
  filename = 'worksphere-integration-logs.xlsx',
) {
  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Logs')
  XLSX.writeFile(workbook, filename)
}
