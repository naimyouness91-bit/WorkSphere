import AsyncStorage from '@react-native-async-storage/async-storage'

const QUEUE_KEY = 'worksphere_offline_queue'
const CACHE_DASHBOARD_KEY = 'worksphere_cache_dashboard'

export interface OfflineAction {
  client_id: string
  type: 'submit_request'
  payload: Record<string, unknown>
  created_at: string
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as OfflineAction[]
  } catch {
    return []
  }
}

export async function enqueueOfflineAction(action: Omit<OfflineAction, 'created_at'>): Promise<void> {
  const queue = await getOfflineQueue()
  queue.push({ ...action, created_at: new Date().toISOString() })
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY)
}

export async function setCachedDashboard(data: unknown): Promise<void> {
  await AsyncStorage.setItem(CACHE_DASHBOARD_KEY, JSON.stringify({ data, at: Date.now() }))
}

export async function getCachedDashboard<T>(): Promise<{ data: T; at: number } | null> {
  const raw = await AsyncStorage.getItem(CACHE_DASHBOARD_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as { data: T; at: number }
  } catch {
    return null
  }
}
