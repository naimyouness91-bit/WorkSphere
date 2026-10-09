import { mobileOfflineApi } from '../services/mobileOfflineApi'
import {
  clearQueue,
  enqueueAction,
  getOfflineBundle,
  getOfflineMeta,
  getQueuedActions,
  removeQueuedAction,
  saveOfflineBundle,
  setLastSyncAt,
  type OfflineBundle,
  type QueuedAction,
} from './db'

export type SyncListener = (detail: {
  status: 'fetching' | 'syncing' | 'idle'
  lastSyncAt: string | null
  pendingCount: number
}) => void

const listeners = new Set<SyncListener>()

function notify(status: 'fetching' | 'syncing' | 'idle') {
  void getOfflineMeta().then((meta) => {
    listeners.forEach((fn) =>
      fn({
        status,
        lastSyncAt: meta.last_sync_at,
        pendingCount: meta.pending_count,
      }),
    )
  })
}

export function subscribeSync(listener: SyncListener): () => void {
  listeners.add(listener)
  void getOfflineMeta().then((meta) =>
    listener({ status: 'idle', lastSyncAt: meta.last_sync_at, pendingCount: meta.pending_count }),
  )
  return () => listeners.delete(listener)
}

export async function fetchAndCacheOfflineData(): Promise<OfflineBundle> {
  notify('fetching')
  try {
    const res = await mobileOfflineApi.getOfflineData()
    const bundle = res.data.data
    await saveOfflineBundle(bundle)
    return bundle
  } finally {
    notify('idle')
  }
}

export async function queueOfflineAction(
  action: Omit<QueuedAction, 'created_at'>,
): Promise<void> {
  await enqueueAction(action)
  notify('idle')
}

export async function flushOfflineQueue(): Promise<{
  applied: number
  failed: number
  conflicts: number
}> {
  const queue = await getQueuedActions()
  if (queue.length === 0) {
    return { applied: 0, failed: 0, conflicts: 0 }
  }

  notify('syncing')
  try {
    const res = await mobileOfflineApi.syncOfflineChanges({
      actions: queue.map((a) => ({
        type: a.type,
        payload: a.payload,
        client_id: a.client_id,
      })),
    })

    const { results, summary } = res.data.data

    for (const result of results) {
      const clientId = result.client_id as string | undefined
      if (!clientId) continue
      if (result.status === 'ok' || result.status === 'conflict') {
        await removeQueuedAction(clientId)
      }
    }

    const now = new Date().toISOString()
    await setLastSyncAt(now)

    if (navigator.onLine) {
      try {
        await fetchAndCacheOfflineData()
      } catch {
        /* refresh bundle when possible */
      }
    }

    return summary
  } finally {
    notify('idle')
  }
}

export async function forceFullSync(): Promise<void> {
  await flushOfflineQueue()
  if (navigator.onLine) {
    await fetchAndCacheOfflineData()
    await setLastSyncAt(new Date().toISOString())
  }
}

export async function getCachedModuleCounts(): Promise<Record<string, number>> {
  const bundle = await getOfflineBundle()
  if (!bundle) {
    return { tasks: 0, attendance: 0, requests: 0, policies: 0 }
  }
  return {
    tasks: bundle.tasks?.length ?? 0,
    attendance: bundle.attendance?.length ?? 0,
    requests: bundle.requests?.length ?? 0,
    policies: bundle.policies?.length ?? 0,
  }
}

export async function clearAllOfflineData(): Promise<void> {
  await clearQueue()
  notify('idle')
}
