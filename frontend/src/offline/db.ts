import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export interface OfflineBundle {
  synced_at: string
  employees: unknown[]
  tasks: unknown[]
  policies: unknown[]
  assets: unknown[]
  requests: unknown[]
  attendance: unknown[]
}

export interface QueuedAction {
  client_id: string
  type: 'submit_request' | 'update_task_status' | 'upsert_attendance'
  payload: Record<string, unknown>
  created_at: string
}

export interface OfflineMeta {
  last_sync_at: string | null
  last_fetch_at: string | null
  pending_count: number
}

interface WorkSphereOfflineDB extends DBSchema {
  bundle: {
    key: 'current'
    value: OfflineBundle
  }
  queue: {
    key: string
    value: QueuedAction
    indexes: { 'by-created': string }
  }
  meta: {
    key: 'status'
    value: OfflineMeta
  }
}

const DB_NAME = 'worksphere-offline'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<WorkSphereOfflineDB>> | null = null

export function getOfflineDb(): Promise<IDBPDatabase<WorkSphereOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WorkSphereOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('bundle')
        const queue = db.createObjectStore('queue', { keyPath: 'client_id' })
        queue.createIndex('by-created', 'created_at')
        db.createObjectStore('meta')
      },
    })
  }
  return dbPromise
}

export async function saveOfflineBundle(bundle: OfflineBundle): Promise<void> {
  const db = await getOfflineDb()
  await db.put('bundle', bundle, 'current')
  const meta = (await db.get('meta', 'status')) ?? {
    last_sync_at: null,
    last_fetch_at: null,
    pending_count: 0,
  }
  meta.last_fetch_at = bundle.synced_at
  await db.put('meta', meta, 'status')
}

export async function getOfflineBundle(): Promise<OfflineBundle | null> {
  const db = await getOfflineDb()
  return (await db.get('bundle', 'current')) ?? null
}

export async function enqueueAction(action: Omit<QueuedAction, 'created_at'>): Promise<void> {
  const db = await getOfflineDb()
  const entry: QueuedAction = { ...action, created_at: new Date().toISOString() }
  await db.put('queue', entry)
  const meta = (await db.get('meta', 'status')) ?? {
    last_sync_at: null,
    last_fetch_at: null,
    pending_count: 0,
  }
  const count = await db.count('queue')
  meta.pending_count = count
  await db.put('meta', meta, 'status')
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  const db = await getOfflineDb()
  return db.getAllFromIndex('queue', 'by-created')
}

export async function removeQueuedAction(clientId: string): Promise<void> {
  const db = await getOfflineDb()
  await db.delete('queue', clientId)
  const meta = (await db.get('meta', 'status')) ?? {
    last_sync_at: null,
    last_fetch_at: null,
    pending_count: 0,
  }
  meta.pending_count = await db.count('queue')
  await db.put('meta', meta, 'status')
}

export async function clearQueue(): Promise<void> {
  const db = await getOfflineDb()
  await db.clear('queue')
  const meta = (await db.get('meta', 'status')) ?? {
    last_sync_at: null,
    last_fetch_at: null,
    pending_count: 0,
  }
  meta.pending_count = 0
  await db.put('meta', meta, 'status')
}

export async function getOfflineMeta(): Promise<OfflineMeta> {
  const db = await getOfflineDb()
  return (
    (await db.get('meta', 'status')) ?? {
      last_sync_at: null,
      last_fetch_at: null,
      pending_count: 0,
    }
  )
}

export async function setLastSyncAt(iso: string): Promise<void> {
  const db = await getOfflineDb()
  const meta = await getOfflineMeta()
  meta.last_sync_at = iso
  await db.put('meta', meta, 'status')
}
