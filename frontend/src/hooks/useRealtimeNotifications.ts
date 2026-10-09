import { useEffect, useRef } from 'react'
import { disconnectEcho, initEcho } from '../lib/echo'
import { useAppDispatch, useAppSelector } from './redux'
import { fetchNotifications, receiveRealtimeNotification } from '../store/notificationSlice'
import type { AppNotification } from '../types/notification'

export function useRealtimeNotifications() {
  const dispatch = useAppDispatch()
  const { token, user } = useAppSelector((state) => state.auth)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!token || !user) {
      disconnectEcho()
      return
    }

    dispatch(fetchNotifications())

    let cancelled = false

    void initEcho(token).then((echo) => {
      if (cancelled || !echo) {
        return
      }

      channelRef.current?.stopListening('.notification.sent')
      const channel = echo.private(`user.${user.id}`)
      channelRef.current = channel

      channel.listen('.notification.sent', (payload: AppNotification) => {
        dispatch(
          receiveRealtimeNotification({
            ...payload,
            read_status: Boolean(payload.read_status),
          }),
        )
      })
    })

    return () => {
      cancelled = true
      channelRef.current?.stopListening('.notification.sent')
      channelRef.current = null
    }
  }, [dispatch, token, user])
}
