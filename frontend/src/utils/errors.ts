import axios from 'axios'

function unreachableApiMessage(): string {
  const base = import.meta.env.VITE_API_URL ?? '/api'
  const proxy = import.meta.env.VITE_DEV_API_PROXY ?? 'http://127.0.0.1:8765'
  return `Cannot reach the API (${base}). Start the backend from the project root: .\\scripts\\start-backend.ps1 (proxies to ${proxy}), then restart npm run dev.`
}

export function extractApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return unreachableApiMessage()
    }

    const { status, data } = err.response

    if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
      if (status === 404) {
        return `API route not found (${err.config?.url ?? 'unknown'}). ${unreachableApiMessage()}`
      }
      return `Server returned HTML instead of JSON (HTTP ${status}). ${unreachableApiMessage()}`
    }

    if (data && typeof data === 'object') {
      const body = data as Record<string, unknown>

      if (typeof body.message === 'string') {
        return body.message
      }

      const errors = body.errors as Record<string, string[]> | undefined
      if (errors) {
        const firstKey = Object.keys(errors)[0]
        if (firstKey && errors[firstKey]?.[0]) {
          return errors[firstKey][0]
        }
      }
    }

    if (status === 401) {
      return 'Invalid email or password.'
    }

    if (status === 422) {
      return 'Validation failed. Check your input.'
    }

    return `${fallback} (HTTP ${status})`
  }

  return fallback
}
