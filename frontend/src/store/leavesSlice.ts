import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { leavesApi } from '../services/leavesApi'
import type { CalendarEvent, Leave, LeaveFilters, LeaveFormData } from '../types/leave'
import { emptyLeaveFilters } from '../types/leave'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface LeavesState {
  items: Leave[]
  calendarEvents: CalendarEvent[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  filters: LeaveFilters
  isFormOpen: boolean
  viewMode: 'table' | 'calendar'
  error: string | null
}

const initialState: LeavesState = {
  items: [],
  calendarEvents: [],
  status: 'idle',
  mutationStatus: 'idle',
  filters: emptyLeaveFilters(),
  isFormOpen: false,
  viewMode: 'table',
  error: null,
}

export const fetchLeaves = createAsyncThunk(
  'leaves/fetchAll',
  async (filters: LeaveFilters, { rejectWithValue }) => {
    try {
      const { data } = await leavesApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load leaves'))
    }
  },
)

export const fetchLeaveCalendar = createAsyncThunk(
  'leaves/calendar',
  async (
    { start, end, employeeId }: { start: string; end: string; employeeId?: number },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await leavesApi.calendar(start, end, employeeId)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load calendar'))
    }
  },
)

export const createLeave = createAsyncThunk(
  'leaves/create',
  async (payload: LeaveFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await leavesApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to submit leave')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const approveLeave = createAsyncThunk(
  'leaves/approve',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await leavesApi.updateStatus(id, 'approved')
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to approve')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const rejectLeave = createAsyncThunk(
  'leaves/reject',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await leavesApi.updateStatus(id, 'rejected')
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to reject')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const leavesSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    setLeaveFilters: (state, action: PayloadAction<LeaveFilters>) => {
      state.filters = action.payload
    },
    openLeaveForm: (state) => {
      state.isFormOpen = true
    },
    closeLeaveForm: (state) => {
      state.isFormOpen = false
    },
    setLeaveViewMode: (state, action: PayloadAction<'table' | 'calendar'>) => {
      state.viewMode = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchLeaves.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchLeaveCalendar.fulfilled, (state, action) => {
        state.calendarEvents = action.payload
      })
      .addCase(createLeave.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
        state.isFormOpen = false
      })
      .addCase(approveLeave.fulfilled, (state, action) => {
        const i = state.items.findIndex((l) => l.id === action.payload.id)
        if (i >= 0) state.items[i] = action.payload
      })
      .addCase(rejectLeave.fulfilled, (state, action) => {
        const i = state.items.findIndex((l) => l.id === action.payload.id)
        if (i >= 0) state.items[i] = action.payload
      })
  },
})

export const { setLeaveFilters, openLeaveForm, closeLeaveForm, setLeaveViewMode } =
  leavesSlice.actions
export default leavesSlice.reducer
