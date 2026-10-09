import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { reportsApi } from '../services/reportsApi'
import type {
  DrillDownItem,
  ReportFilters,
  ReportFormData,
  ReportStatistics,
  SavedReport,
} from '../types/report'
import { emptyReportFilters } from '../types/report'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface ReportsState {
  statistics: ReportStatistics | null
  departments: string[]
  savedReports: SavedReport[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  savedStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  drillDownStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  filters: ReportFilters
  drillDown: {
    module: string
    segment: string
    label: string
    items: DrillDownItem[]
  } | null
  isDrillDownOpen: boolean
  isGenerateOpen: boolean
  selectedReport: SavedReport | null
}

const initialState: ReportsState = {
  statistics: null,
  departments: [],
  savedReports: [],
  status: 'idle',
  savedStatus: 'idle',
  mutationStatus: 'idle',
  drillDownStatus: 'idle',
  error: null,
  filters: emptyReportFilters(),
  drillDown: null,
  isDrillDownOpen: false,
  isGenerateOpen: false,
  selectedReport: null,
}

export const fetchReportStatistics = createAsyncThunk(
  'reports/fetchStatistics',
  async (filters: ReportFilters, { rejectWithValue }) => {
    try {
      const { data } = await reportsApi.statistics(filters)
      return { statistics: data.data, departments: data.departments }
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load report statistics'))
    }
  },
)

export const fetchSavedReports = createAsyncThunk(
  'reports/fetchSaved',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await reportsApi.index()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load saved reports'))
    }
  },
)

export const generateReport = createAsyncThunk(
  'reports/generate',
  async (payload: ReportFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await reportsApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to generate report')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const loadSavedReport = createAsyncThunk(
  'reports/loadSaved',
  async (id: number, { rejectWithValue }) => {
    try {
      const { data } = await reportsApi.show(id)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load report'))
    }
  },
)

export const fetchDrillDown = createAsyncThunk(
  'reports/drillDown',
  async (
    {
      module,
      segment,
      label,
      filters,
    }: { module: string; segment: string; label: string; filters: ReportFilters },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await reportsApi.drillDown(module, segment, filters)
      return { module, segment, label, items: data.data.items }
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load details'))
    }
  },
)

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setReportFilters: (state, action: PayloadAction<ReportFilters>) => {
      state.filters = action.payload
    },
    openGenerateReport: (state) => {
      state.isGenerateOpen = true
    },
    closeGenerateReport: (state) => {
      state.isGenerateOpen = false
    },
    closeDrillDown: (state) => {
      state.isDrillDownOpen = false
      state.drillDown = null
      state.drillDownStatus = 'idle'
    },
    selectSavedReport: (state, action: PayloadAction<SavedReport | null>) => {
      state.selectedReport = action.payload
      if (action.payload?.payload) {
        state.statistics = action.payload.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportStatistics.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchReportStatistics.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.statistics = action.payload.statistics
        state.departments = action.payload.departments
      })
      .addCase(fetchReportStatistics.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchSavedReports.pending, (state) => {
        state.savedStatus = 'loading'
      })
      .addCase(fetchSavedReports.fulfilled, (state, action) => {
        state.savedStatus = 'succeeded'
        state.savedReports = action.payload
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isGenerateOpen = false
        state.savedReports = [action.payload, ...state.savedReports]
      })
      .addCase(generateReport.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(generateReport.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(fetchDrillDown.pending, (state) => {
        state.drillDownStatus = 'loading'
        state.isDrillDownOpen = true
      })
      .addCase(fetchDrillDown.fulfilled, (state, action) => {
        state.drillDownStatus = 'succeeded'
        state.drillDown = action.payload
      })
      .addCase(fetchDrillDown.rejected, (state) => {
        state.drillDownStatus = 'failed'
      })
      .addCase(loadSavedReport.fulfilled, (state, action) => {
        state.selectedReport = action.payload
        if (action.payload.payload) {
          state.statistics = action.payload.payload
        }
      })
  },
})

export const {
  setReportFilters,
  openGenerateReport,
  closeGenerateReport,
  closeDrillDown,
  selectSavedReport,
} = reportsSlice.actions
export default reportsSlice.reducer
