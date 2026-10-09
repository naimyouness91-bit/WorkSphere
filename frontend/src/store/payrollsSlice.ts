import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { payrollsApi } from '../services/payrollsApi'
import type {
  PayrollFilters,
  PayrollFormData,
  PayrollRecord,
  PayrollSummary,
} from '../types/payroll'
import { emptyPayrollFilters } from '../types/payroll'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface PayrollsState {
  items: PayrollRecord[]
  summary: PayrollSummary | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  summaryStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: PayrollFilters
  selectedRecord: PayrollRecord | null
  isFormOpen: boolean
  formMode: 'create' | 'edit'
}

const initialState: PayrollsState = {
  items: [],
  summary: null,
  status: 'idle',
  summaryStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyPayrollFilters(),
  selectedRecord: null,
  isFormOpen: false,
  formMode: 'create',
}

export const fetchPayrolls = createAsyncThunk(
  'payrolls/fetchAll',
  async (filters: PayrollFilters, { rejectWithValue }) => {
    try {
      const { data } = await payrollsApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load payroll records'))
    }
  },
)

export const fetchPayrollSummary = createAsyncThunk(
  'payrolls/fetchSummary',
  async (filters: PayrollFilters, { rejectWithValue }) => {
    try {
      const { data } = await payrollsApi.summary(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load payroll summary'))
    }
  },
)

export const createPayroll = createAsyncThunk(
  'payrolls/create',
  async (payload: PayrollFormData, { rejectWithValue, dispatch, getState }) => {
    try {
      const { data } = await payrollsApi.store(payload)
      dispatch(
        addNotification({
          type: 'success',
          message: data.message ?? 'Payroll record created.',
        }),
      )
      const filters = (getState() as { payrolls: PayrollsState }).payrolls.filters
      dispatch(fetchPayrollSummary(filters))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create payroll record')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updatePayroll = createAsyncThunk(
  'payrolls/update',
  async (
    { id, data: payload }: { id: number; data: PayrollFormData },
    { rejectWithValue, dispatch, getState },
  ) => {
    try {
      const { data } = await payrollsApi.update(id, payload)
      dispatch(
        addNotification({
          type: 'success',
          message: data.message ?? 'Payroll record updated.',
        }),
      )
      const filters = (getState() as { payrolls: PayrollsState }).payrolls.filters
      dispatch(fetchPayrollSummary(filters))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update payroll record')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const payrollsSlice = createSlice({
  name: 'payrolls',
  initialState,
  reducers: {
    setPayrollFilters: (state, action: PayloadAction<PayrollFilters>) => {
      state.filters = action.payload
    },
    openCreatePayrollForm: (state) => {
      state.formMode = 'create'
      state.selectedRecord = null
      state.isFormOpen = true
    },
    openEditPayrollForm: (state, action: PayloadAction<PayrollRecord>) => {
      state.formMode = 'edit'
      state.selectedRecord = action.payload
      state.isFormOpen = true
    },
    closePayrollForm: (state) => {
      state.isFormOpen = false
      state.selectedRecord = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrolls.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchPayrolls.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchPayrolls.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchPayrollSummary.pending, (state) => {
        state.summaryStatus = 'loading'
      })
      .addCase(fetchPayrollSummary.fulfilled, (state, action) => {
        state.summaryStatus = 'succeeded'
        state.summary = action.payload
      })
      .addCase(fetchPayrollSummary.rejected, (state) => {
        state.summaryStatus = 'failed'
      })
      .addCase(createPayroll.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createPayroll.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.unshift(action.payload)
        state.isFormOpen = false
      })
      .addCase(createPayroll.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updatePayroll.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updatePayroll.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const index = state.items.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
        state.isFormOpen = false
        state.selectedRecord = null
      })
      .addCase(updatePayroll.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
  },
})

export const {
  setPayrollFilters,
  openCreatePayrollForm,
  openEditPayrollForm,
  closePayrollForm,
} = payrollsSlice.actions

export default payrollsSlice.reducer
