import type { ReactNode } from 'react'
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications'

interface RealtimeProviderProps {
  children: ReactNode
}

export default function RealtimeProvider({ children }: RealtimeProviderProps) {
  useRealtimeNotifications()
  return children
}
