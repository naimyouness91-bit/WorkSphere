export interface DocumentOwner {
  id: number
  name: string
  email: string
}

export interface Document {
  id: number
  title: string
  description: string | null
  file_path: string
  original_filename: string
  mime_type: string
  file_size: number
  employee_id: number
  uploaded_at: string
  created_at: string
  updated_at: string
  is_previewable: boolean
  employee?: DocumentOwner
  download_url: string
  preview_url: string | null
}

export interface DocumentFormData {
  title: string
  description: string
  file: File | null
}

export function emptyDocumentForm(): DocumentFormData {
  return {
    title: '',
    description: '',
    file: null,
  }
}

export const ALLOWED_FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*'

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
