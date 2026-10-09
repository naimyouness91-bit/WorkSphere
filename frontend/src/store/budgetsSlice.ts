import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { budgetsApi, financeApi } from '../services/budgetsApi'
import type { Budget, BudgetFilters, BudgetFormData, FinanceSummary } from '../types/budget'
import { emptyBudgetFilters } from '../types/budget'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface BudgetsState {
  items: Budget[]
  departments: string[]
  summary: FinanceSummary | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: BudgetFilters
  selectedBudget: Budget | null
  isFormOpen: boolean
}

const initialState: BudgetsState = {
  items: [],
  departments: [],
  summary: null,
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyBudgetFilters(),
  selectedBudget: null,
  isFormOpen: false,
}

export const fetchBudgets = createAsyncThunk(
  'budgets/fetchAll',
  async (filters: BudgetFilters, { rejectWithValue }) => {
    try {
      const { data } = await budgetsApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load budgets'))
    }
  },
)

export const fetchBudgetDepartments = createAsyncThunk(
  'budgets/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await budgetsApi.departments()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load departments'))
    }
  },
)

export const fetchFinanceSummary = createAsyncThunk(
  'budgets/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await financeApi.summary()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load finance summary'))
    }
  },
)

export const createBudget = createAsyncThunk(
  'budgets/create',
  async (payload: BudgetFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await budgetsApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create budget')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateBudget = createAsyncThunk(
  'budgets/update',
  async (
    { id, data: payload }: { id: number; data: Partial<BudgetFormData> },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await budgetsApi.update(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update budget')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteBudget = createAsyncThunk(
  'budgets/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await budgetsApi.destroy(id)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete budget')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    setBudgetFilters: (state, action: PayloadAction<BudgetFilters>) => {
      state.filters = action.payload
    },
    openBudgetForm: (state, action: PayloadAction<Budget | null>) => {
      state.selectedBudget = action.payload
      state.isFormOpen = true
    },
    closeBudgetForm: (state) => {
      state.isFormOpen = false
      state.selectedBudget = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchBudgetDepartments.fulfilled, (state, action) => {
        state.departments = action.payload
      })
      .addCase(fetchFinanceSummary.fulfilled, (state, action) => {
        state.summary = action.payload
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isFormOpen = false
        state.selectedBudget = null
        state.items = [action.payload, ...state.items]
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isFormOpen = false
        state.selectedBudget = null
        const idx = state.items.findIndex((b) => b.id === action.payload.id)
        if (idx >= 0) state.items[idx] = action.payload
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload)
      })
  },
})

export const { setBudgetFilters, openBudgetForm, closeBudgetForm } = budgetsSlice.actions
export default budgetsSlice.reducer
