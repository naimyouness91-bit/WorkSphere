import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { notificationsApi } from '../services/notificationsApi'
import type { AppNotification, NotificationType, ToastNotification } from '../types/notification'
import { extractApiError } from '../utils/errors'

interface NotificationState {
  items: AppNotification[]
  unreadCount: number
  toasts: ToastNotification[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  toasts: [],
  status: 'idle',
}

let toastCounter = 0

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await notificationsApi.index()
      return { items: data.data, unreadCount: data.unread_count }
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load notifications'))
    }
  },
)

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id: number, { rejectWithValue }) => {
    try {
      await notificationsApi.markAsRead(id)
      return id
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to mark notification as read'))
    }
  },
)

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.markAllAsRead()
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to mark all as read'))
    }
  },
)

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addToast: (
      state,
      action: PayloadAction<{ type: NotificationType; message: string }>,
    ) => {
      state.toasts.push({
        id: String(++toastCounter),
        type: action.payload.type,
        message: action.payload.message,
      })
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((n) => n.id !== action.payload)
    },
    receiveRealtimeNotification: (state, action: PayloadAction<AppNotification>) => {
      const exists = state.items.some((n) => n.id === action.payload.id)
      if (!exists) {
        state.items.unshift(action.payload)
        if (!action.payload.read_status) {
          state.unreadCount += 1
        }
      }
      state.toasts.push({
        id: String(++toastCounter),
        type: action.payload.type,
        message: action.payload.message,
      })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.unreadCount = action.payload.unreadCount
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.status = 'failed'
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload)
        if (item && !item.read_status) {
          item.read_status = true
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.read_status = true
        })
        state.unreadCount = 0
      })
  },
})

export const {
  addToast,
  removeToast,
  receiveRealtimeNotification,
} = notificationSlice.actions

/** @deprecated Use addToast — kept for existing action handlers */
export const addNotification = addToast
export const removeNotification = removeToast

export default notificationSlice.reducer
