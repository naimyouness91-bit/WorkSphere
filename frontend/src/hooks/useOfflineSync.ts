import { useCallback, useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from './redux'
import { addNotification } from '../store/notificationSlice'
import { useOnlineStatus } from './useOnlineStatus'
import { getOfflineMeta } from '../offline/db'
import {
  fetchAndCacheOfflineData,
  flushOfflineQueue,
  forceFullSync,
  subscribeSync,
} from '../offline/syncManager'
import { useTranslation } from 'react-i18next'

export function useOfflineSync() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const online = useOnlineStatus()
  const { token } = useAppSelector((s) => s.auth)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const refreshMeta = useCallback(async () => {
    const meta = await getOfflineMeta()
    setLastSyncAt(meta.last_sync_at)
    setPendingCount(meta.pending_count)
  }, [])

  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => {
      void refreshMeta()
    }, 0)
    const unsubscribe = subscribeSync((detail) => {
      setLastSyncAt(detail.lastSyncAt)
      setPendingCount(detail.pendingCount)
      setSyncing(detail.status !== 'idle')
    })
    return () => {
      clearTimeout(timer)
      unsubscribe()
    }
  }, [token, refreshMeta])

  useEffect(() => {
    if (!token || !online) return

    let cancelled = false

    const run = async () => {
      setSyncing(true)
      try {
        const summary = await flushOfflineQueue()
        if (!cancelled && summary.applied > 0) {
          dispatch(
            addNotification({
              type: 'success',
              message: t('offline.syncSuccess', { count: summary.applied }),
            }),
          )
        }
        if (!cancelled && summary.failed > 0) {
          dispatch(
            addNotification({
              type: 'error',
              message: t('offline.syncPartialFail', { count: summary.failed }),
            }),
          )
        }
        if (!cancelled && summary.conflicts > 0) {
          dispatch(
            addNotification({
              type: 'error',
              message: t('offline.syncConflicts', { count: summary.conflicts }),
            }),
          )
        }
        await fetchAndCacheOfflineData()
      } catch {
        if (!cancelled) {
          dispatch(addNotification({ type: 'error', message: t('offline.syncFailed') }))
        }
      } finally {
        if (!cancelled) {
          setSyncing(false)
          await refreshMeta()
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [token, online, dispatch, t, refreshMeta])

  const manualSync = useCallback(async () => {
    if (!online) {
      dispatch(addNotification({ type: 'error', message: t('offline.mustBeOnline') }))
      return
    }
    setSyncing(true)
    try {
      await forceFullSync()
      dispatch(addNotification({ type: 'success', message: t('offline.manualSyncDone') }))
    } catch {
      dispatch(addNotification({ type: 'error', message: t('offline.syncFailed') }))
    } finally {
      setSyncing(false)
      await refreshMeta()
    }
  }, [online, dispatch, t, refreshMeta])

  return {
    online,
    lastSyncAt,
    pendingCount,
    syncing,
    manualSync,
    refreshMeta,
  }
}
