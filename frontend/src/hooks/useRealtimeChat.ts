import { useEffect, useRef } from 'react'
import { getEcho, initEcho } from '../lib/echo'
import { useAppDispatch, useAppSelector } from './redux'
import {
  markMessageReadLocal,
  receiveMessage,
  setTypingUsers,
} from '../store/chatSlice'
import type { ChatMessage } from '../types/chat'

export function useRealtimeChat(conversationId: number | null) {
  const dispatch = useAppDispatch()
  const { token, user } = useAppSelector((state) => state.auth)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!token || !user || !conversationId) {
      return
    }

    let cancelled = false

    const subscribe = async () => {
      let echo = getEcho()
      if (!echo) {
        echo = await initEcho(token)
      }
      if (cancelled || !echo) return

      channelRef.current?.stopListening('.message.sent')
      channelRef.current?.stopListening('.user.typing')
      channelRef.current?.stopListening('.message.read')

      const channel = echo.private(`conversation.${conversationId}`)
      channelRef.current = channel

      channel.listen('.message.sent', (payload: { message: ChatMessage }) => {
        dispatch(receiveMessage(payload.message))
      })

      channel.listen(
        '.user.typing',
        (payload: { user_id: number; user_name: string; is_typing: boolean }) => {
          if (payload.user_id === user.id) return
          dispatch(
            setTypingUsers({
              userId: payload.user_id,
              userName: payload.user_name,
              isTyping: payload.is_typing,
            }),
          )
        },
      )

      channel.listen('.message.read', (payload: { message_id: number; reader_id: number }) => {
        dispatch(
          markMessageReadLocal({
            messageId: payload.message_id,
            readerId: payload.reader_id,
          }),
        )
      })
    }

    void subscribe()

    return () => {
      cancelled = true
      channelRef.current?.stopListening('.message.sent')
      channelRef.current?.stopListening('.user.typing')
      channelRef.current?.stopListening('.message.read')
      channelRef.current = null
    }
  }, [dispatch, token, user, conversationId])
}
