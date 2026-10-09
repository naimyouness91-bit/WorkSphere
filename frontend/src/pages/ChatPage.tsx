import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConversationList from '../components/chat/ConversationList'
import GroupChatModal from '../components/chat/GroupChatModal'
import MessageBubble from '../components/chat/MessageBubble'
import MessageInput from '../components/chat/MessageInput'
import NewChatModal from '../components/chat/NewChatModal'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { useRealtimeChat } from '../hooks/useRealtimeChat'
import { usersApi } from '../services/usersApi'
import { chatApi } from '../services/chatApi'
import {
  createConversation,
  fetchConversations,
  fetchMessages,
  openGroupModal,
  closeGroupModal,
  sendChatMessage,
  setActiveConversation,
} from '../store/chatSlice'
import type { AppUser } from '../types/userList'

export default function ChatPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((s) => s.auth)
  const {
    conversations,
    activeConversationId,
    messages,
    status,
    messagesStatus,
    sendStatus,
    typingUsers,
    isGroupModalOpen,
  } = useAppSelector((s) => s.chat)

  const [users, setUsers] = useState<AppUser[]>([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useRealtimeChat(activeConversationId)

  // Bring the conversation pane to the front on mobile whenever the active
  // conversation changes (adjust state during render instead of an effect).
  const [prevActiveConv, setPrevActiveConv] = useState(activeConversationId)
  if (prevActiveConv !== activeConversationId) {
    setPrevActiveConv(activeConversationId)
    setMobileShowChat(true)
  }

  useEffect(() => {
    dispatch(fetchConversations())
    usersApi.index().then((res) => setUsers(res.data.data))
  }, [dispatch])

  useEffect(() => {
    if (activeConversationId) {
      dispatch(fetchMessages(activeConversationId))
    }
  }, [dispatch, activeConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  const headerTitle =
    activeConversation?.type === 'group'
      ? activeConversation.name
      : activeConversation?.participants?.find((p) => p.id !== user?.id)?.name ?? t('chat.selectConversation')

  const handleSend = useCallback(
    (content: string, file?: File) => {
      if (!activeConversationId) return
      const formData = new FormData()
      if (content) formData.append('content', content)
      if (file) formData.append('attachment', file)
      dispatch(sendChatMessage({ conversationId: activeConversationId, formData }))
    },
    [dispatch, activeConversationId],
  )

  const handleTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversationId) return
      if (typingDebounce.current) clearTimeout(typingDebounce.current)
      typingDebounce.current = setTimeout(() => {
        void chatApi.sendTyping(activeConversationId, isTyping)
      }, 300)
    },
    [activeConversationId],
  )

  const startDirectChat = (userId: number) => {
    setShowNewChat(false)
    dispatch(
      createConversation({
        type: 'direct',
        participant_ids: [userId],
      }),
    )
  }

  const startGroupChat = (name: string, participantIds: number[]) => {
    dispatch(
      createConversation({
        type: 'group',
        name,
        participant_ids: participantIds,
      }),
    )
  }

  if (!user) return null

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-7xl flex-col lg:h-[calc(100vh-0px)]">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-none border-0 bg-slate-100 dark:bg-slate-950 lg:m-4 lg:rounded-2xl lg:border lg:border-slate-200 lg:dark:border-slate-700">
        <div
          className={`w-full shrink-0 md:w-80 lg:w-96 ${
            mobileShowChat && activeConversationId ? 'hidden md:flex md:flex-col' : 'flex flex-col'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeId={activeConversationId}
            currentUserId={user.id}
            onSelect={(id) => dispatch(setActiveConversation(id))}
            onNewDirect={() => setShowNewChat(true)}
            onNewGroup={() => dispatch(openGroupModal())}
          />
        </div>

        <div
          className={`flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950 ${
            !mobileShowChat && !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversationId ? (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                <button
                  type="button"
                  className="md:hidden rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    setMobileShowChat(false)
                    dispatch(setActiveConversation(null))
                  }}
                >
                  ←
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate font-semibold text-slate-900 dark:text-slate-50">{headerTitle}</h1>
                  {typingUsers.length > 0 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      {typingUsers.map((t) => t.userName).join(', ')} {t('chat.isTyping')}
                    </p>
                  )}
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messagesStatus === 'loading' && (
                  <p className="text-center text-sm text-slate-500">{t('common.loading')}</p>
                )}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user.id} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <MessageInput
                disabled={sendStatus === 'loading'}
                onSend={handleSend}
                onTyping={handleTyping}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <p className="text-4xl">💬</p>
              <p className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">
                {t('chat.selectConversation')}
              </p>
              <p className="mt-1 text-sm text-slate-500">{t('chat.selectHint')}</p>
            </div>
          )}
        </div>
      </div>

      {status === 'failed' && (
        <p className="p-4 text-center text-red-600">{t('chat.loadError')}</p>
      )}

      {showNewChat && (
        <NewChatModal
          users={users}
          currentUserId={user.id}
          onClose={() => setShowNewChat(false)}
          onSelect={startDirectChat}
        />
      )}

      {isGroupModalOpen && (
        <GroupChatModal
          users={users}
          currentUserId={user.id}
          onClose={() => dispatch(closeGroupModal())}
          onCreate={startGroupChat}
        />
      )}
    </div>
  )
}
