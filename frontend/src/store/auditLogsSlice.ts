import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { auditLogsApi } from '../services/auditLogsApi'
import type { AuditLog, AuditLogFilters, AuditSummary } from '../types/auditLog'
import { emptyAuditLogFilters } from '../types/auditLog'
import { extractApiError } from '../utils/errors'

interface AuditLogsState {
  items: AuditLog[]
  summary: AuditSummary | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  detailStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  filters: AuditLogFilters
  page: number
  lastPage: number
  total: number
  selectedLog: AuditLog | null
  isDetailOpen: boolean
}

const initialState: AuditLogsState = {
  items: [],
  summary: null,
  status: 'idle',
  detailStatus: 'idle',
  error: null,
  filters: emptyAuditLogFilters(),
  page: 1,
  lastPage: 1,
  total: 0,
  selectedLog: null,
  isDetailOpen: false,
}

export const fetchAuditLogs = createAsyncThunk(
  'auditLogs/fetchAll',
  async (
    { filters, page }: { filters: AuditLogFilters; page: number },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await auditLogsApi.index(filters, page)
      return {
        items: data.data,
        meta: data.meta,
      }
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load audit logs'))
    }
  },
)

export const fetchAuditLogDetail = createAsyncThunk(
  'auditLogs/fetchDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await auditLogsApi.show(id)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load audit log'))
    }
  },
)

export const fetchAuditSummary = createAsyncThunk(
  'auditLogs/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await auditLogsApi.summary()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load audit summary'))
    }
  },
)

const auditLogsSlice = createSlice({
  name: 'auditLogs',
  initialState,
  reducers: {
    setAuditLogFilters: (state, action: PayloadAction<AuditLogFilters>) => {
      state.filters = action.payload
      state.page = 1
    },
    setAuditLogPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload
    },
    openAuditLogDetail: (state, action: PayloadAction<AuditLog>) => {
      state.selectedLog = action.payload
      state.isDetailOpen = true
    },
    closeAuditLogDetail: (state) => {
      state.isDetailOpen = false
      state.selectedLog = null
      state.detailStatus = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.page = action.payload.meta.current_page
        state.lastPage = action.payload.meta.last_page
        state.total = action.payload.meta.total
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchAuditLogDetail.pending, (state) => {
        state.detailStatus = 'loading'
      })
      .addCase(fetchAuditLogDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.selectedLog = action.payload
      })
      .addCase(fetchAuditLogDetail.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchAuditSummary.fulfilled, (state, action) => {
        state.summary = action.payload
      })
  },
})

export const {
  setAuditLogFilters,
  setAuditLogPage,
  openAuditLogDetail,
  closeAuditLogDetail,
} = auditLogsSlice.actions
export default auditLogsSlice.reducer
