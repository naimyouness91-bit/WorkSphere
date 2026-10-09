import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { chatApi } from '../services/chatApi'
import type { ChatMessage, Conversation, CreateConversationPayload } from '../types/chat'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface TypingState {
  userId: number
  userName: string
}

interface ChatState {
  conversations: Conversation[]
  activeConversationId: number | null
  messages: ChatMessage[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  messagesStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  sendStatus: 'idle' | 'loading'
  typingUsers: TypingState[]
  isGroupModalOpen: boolean
  error: string | null
}

const initialState: ChatState = {
  conversations: [],
  activeConversationId: null,
  messages: [],
  status: 'idle',
  messagesStatus: 'idle',
  sendStatus: 'idle',
  typingUsers: [],
  isGroupModalOpen: false,
  error: null,
}

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await chatApi.listConversations()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load conversations'))
    }
  },
)

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: number, { rejectWithValue }) => {
    try {
      const { data } = await chatApi.listMessages(conversationId)
      return { conversationId, messages: data.data }
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load messages'))
    }
  },
)

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (payload: CreateConversationPayload, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await chatApi.createConversation(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create conversation')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { conversationId, formData }: { conversationId: number; formData: FormData },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await chatApi.sendMessage(conversationId, formData)
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to send message')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action: PayloadAction<number | null>) => {
      state.activeConversationId = action.payload
      state.typingUsers = []
      if (action.payload === null) {
        state.messages = []
      }
    },
    receiveMessage: (state, action: PayloadAction<ChatMessage>) => {
      const msg = action.payload
      if (state.activeConversationId === msg.conversation_id) {
        if (!state.messages.some((m) => m.id === msg.id)) {
          state.messages.push(msg)
        }
      }
      const conv = state.conversations.find((c) => c.id === msg.conversation_id)
      if (conv) {
        conv.last_message = msg
        conv.updated_at = msg.created_at
        if (state.activeConversationId !== msg.conversation_id) {
          conv.unread_count = (conv.unread_count ?? 0) + 1
        }
      }
      state.conversations.sort((a, b) => {
        const at = a.last_message?.created_at ?? a.updated_at ?? ''
        const bt = b.last_message?.created_at ?? b.updated_at ?? ''
        return bt.localeCompare(at)
      })
    },
    setTypingUsers: (state, action: PayloadAction<{ userId: number; userName: string; isTyping: boolean }>) => {
      const { userId, userName, isTyping } = action.payload
      state.typingUsers = state.typingUsers.filter((t) => t.userId !== userId)
      if (isTyping) {
        state.typingUsers.push({ userId, userName })
      }
    },
    markMessageReadLocal: (state, action: PayloadAction<{ messageId: number; readerId: number }>) => {
      const msg = state.messages.find((m) => m.id === action.payload.messageId)
      if (msg) {
        msg.status = 'read'
        const ids = msg.read_by_user_ids ?? []
        if (!ids.includes(action.payload.readerId)) {
          msg.read_by_user_ids = [...ids, action.payload.readerId]
        }
      }
    },
    clearConversationUnread: (state, action: PayloadAction<number>) => {
      const conv = state.conversations.find((c) => c.id === action.payload)
      if (conv) conv.unread_count = 0
    },
    openGroupModal: (state) => {
      state.isGroupModalOpen = true
    },
    closeGroupModal: (state) => {
      state.isGroupModalOpen = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.conversations = action.payload
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchMessages.pending, (state) => {
        state.messagesStatus = 'loading'
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesStatus = 'succeeded'
        state.messages = action.payload.messages
        state.activeConversationId = action.payload.conversationId
        const conv = state.conversations.find((c) => c.id === action.payload.conversationId)
        if (conv) conv.unread_count = 0
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        const exists = state.conversations.some((c) => c.id === action.payload.id)
        if (!exists) state.conversations.unshift(action.payload)
        state.activeConversationId = action.payload.id
        state.messages = []
        state.isGroupModalOpen = false
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.sendStatus = 'loading'
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendStatus = 'idle'
        if (!state.messages.some((m) => m.id === action.payload.id)) {
          state.messages.push(action.payload)
        }
        const conv = state.conversations.find((c) => c.id === action.payload.conversation_id)
        if (conv) conv.last_message = action.payload
      })
      .addCase(sendChatMessage.rejected, (state) => {
        state.sendStatus = 'idle'
      })
  },
})

export const {
  setActiveConversation,
  receiveMessage,
  setTypingUsers,
  markMessageReadLocal,
  clearConversationUnread,
  openGroupModal,
  closeGroupModal,
} = chatSlice.actions

export default chatSlice.reducer
