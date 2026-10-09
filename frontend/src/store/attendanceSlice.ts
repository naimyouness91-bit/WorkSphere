import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { attendanceApi } from '../services/attendanceApi'
import type { Attendance, AttendanceFilters, AttendanceReportEmployee } from '../types/attendance'
import { emptyAttendanceFilters } from '../types/attendance'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface AttendanceState {
  items: Attendance[]
  today: Attendance | null
  report: AttendanceReportEmployee[]
  totalHours: number
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  filters: AttendanceFilters
  viewMode: 'table' | 'calendar'
  error: string | null
}

const initialState: AttendanceState = {
  items: [],
  today: null,
  report: [],
  totalHours: 0,
  status: 'idle',
  mutationStatus: 'idle',
  filters: emptyAttendanceFilters(),
  viewMode: 'table',
  error: null,
}

export const fetchAttendances = createAsyncThunk(
  'attendance/fetchAll',
  async (filters: AttendanceFilters, { rejectWithValue }) => {
    try {
      const { data } = await attendanceApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load attendance'))
    }
  },
)

export const fetchTodayAttendance = createAsyncThunk(
  'attendance/fetchToday',
  async (employeeId: number | undefined, { rejectWithValue }) => {
    try {
      const { data } = await attendanceApi.today(employeeId)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load today'))
    }
  },
)

export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await attendanceApi.checkIn()
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Check-in failed')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await attendanceApi.checkOut()
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Check-out failed')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const fetchAttendanceReport = createAsyncThunk(
  'attendance/report',
  async (
    { year, month, employeeId }: { year: number; month: number; employeeId?: number },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await attendanceApi.report(year, month, employeeId)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load report'))
    }
  },
)

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setAttendanceFilters: (state, action: PayloadAction<AttendanceFilters>) => {
      state.filters = action.payload
    },
    setAttendanceViewMode: (state, action: PayloadAction<'table' | 'calendar'>) => {
      state.viewMode = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendances.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchAttendances.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchAttendances.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.today = action.payload
      })
      .addCase(checkIn.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.today = action.payload
        const i = state.items.findIndex((a) => a.id === action.payload.id)
        if (i >= 0) state.items[i] = action.payload
        else state.items.unshift(action.payload)
      })
      .addCase(checkIn.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(checkOut.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.today = action.payload
        const i = state.items.findIndex((a) => a.id === action.payload.id)
        if (i >= 0) state.items[i] = action.payload
      })
      .addCase(checkOut.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(fetchAttendanceReport.fulfilled, (state, action) => {
        state.report = action.payload.by_employee
      })
  },
})

export const { setAttendanceFilters, setAttendanceViewMode } = attendanceSlice.actions
export default attendanceSlice.reducer
