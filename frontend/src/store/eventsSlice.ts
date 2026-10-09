import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { eventsApi } from '../services/eventsApi'
import type { CalendarEvent, EventFilters, EventFormData } from '../types/event'
import { emptyEventFilters, toIsoFromLocalInput } from '../types/event'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface EventsState {
  items: CalendarEvent[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: EventFilters
  selectedEvent: CalendarEvent | null
  isFormOpen: boolean
  formMode: 'create' | 'edit'
}

const initialState: EventsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyEventFilters(),
  selectedEvent: null,
  isFormOpen: false,
  formMode: 'create',
}

export const fetchEvents = createAsyncThunk(
  'events/fetchAll',
  async (filters: EventFilters, { rejectWithValue }) => {
    try {
      const params: Record<string, string> = {}
      if (filters.employee_id) params.employee_id = filters.employee_id
      if (filters.type) params.type = filters.type
      if (filters.status) params.status = filters.status
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to

      const { data } = await eventsApi.index(params)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load events'))
    }
  },
)

export const createEvent = createAsyncThunk(
  'events/create',
  async (payload: EventFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await eventsApi.store({
        title: payload.title,
        description: payload.description || null,
        type: payload.type,
        status: payload.status,
        start_date: toIsoFromLocalInput(payload.start_date),
        end_date: toIsoFromLocalInput(payload.end_date),
      })
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create event')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateEvent = createAsyncThunk(
  'events/update',
  async (
    { id, data: payload }: { id: number; data: Partial<EventFormData> },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const body: Record<string, unknown> = { ...payload }
      if (payload.start_date) {
        body.start_date = toIsoFromLocalInput(payload.start_date)
      }
      if (payload.end_date) {
        body.end_date = toIsoFromLocalInput(payload.end_date)
      }

      const { data } = await eventsApi.update(id, body)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update event')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const rescheduleEvent = createAsyncThunk(
  'events/reschedule',
  async (
    { id, start_date, end_date }: { id: number; start_date: string; end_date: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await eventsApi.update(id, { start_date, end_date })
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to reschedule event')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<EventFilters>) => {
      state.filters = action.payload
    },
    openCreateForm: (state) => {
      state.formMode = 'create'
      state.selectedEvent = null
      state.isFormOpen = true
    },
    openEditForm: (state, action: PayloadAction<CalendarEvent>) => {
      state.formMode = 'edit'
      state.selectedEvent = action.payload
      state.isFormOpen = true
    },
    closeForm: (state) => {
      state.isFormOpen = false
      state.selectedEvent = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createEvent.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isFormOpen = false
        state.items.push(action.payload)
      })
      .addCase(createEvent.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateEvent.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isFormOpen = false
        const idx = state.items.findIndex((e) => e.id === action.payload.id)
        if (idx >= 0) {
          state.items[idx] = action.payload
        }
      })
      .addCase(updateEvent.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(rescheduleEvent.fulfilled, (state, action) => {
        const idx = state.items.findIndex((e) => e.id === action.payload.id)
        if (idx >= 0) {
          state.items[idx] = action.payload
        }
      })
  },
})

export const { setFilters, openCreateForm, openEditForm, closeForm } = eventsSlice.actions
export default eventsSlice.reducer
