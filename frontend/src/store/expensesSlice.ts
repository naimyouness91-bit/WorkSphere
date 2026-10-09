import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { expensesApi } from '../services/expensesApi'
import type {
  Expense,
  ExpenseFilters,
  ExpenseStatusUpdate,
  ExpenseSubmitData,
} from '../types/expense'
import { emptyExpenseFilters } from '../types/expense'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface ExpensesState {
  items: Expense[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: ExpenseFilters
  isSubmitOpen: boolean
}

const initialState: ExpensesState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyExpenseFilters(),
  isSubmitOpen: false,
}

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchAll',
  async (filters: ExpenseFilters, { rejectWithValue }) => {
    try {
      const { data } = await expensesApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load expenses'))
    }
  },
)

export const createExpense = createAsyncThunk(
  'expenses/create',
  async (payload: ExpenseSubmitData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await expensesApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to submit expense')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateExpenseStatus = createAsyncThunk(
  'expenses/updateStatus',
  async (
    { id, data: payload }: { id: number; data: ExpenseStatusUpdate },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await expensesApi.updateStatus(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update expense')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setExpenseFilters: (state, action: PayloadAction<ExpenseFilters>) => {
      state.filters = action.payload
    },
    openSubmitExpenseForm: (state) => {
      state.isSubmitOpen = true
    },
    closeSubmitExpenseForm: (state) => {
      state.isSubmitOpen = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createExpense.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isSubmitOpen = false
        state.items = [action.payload, ...state.items]
      })
      .addCase(createExpense.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateExpenseStatus.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateExpenseStatus.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const idx = state.items.findIndex((e) => e.id === action.payload.id)
        if (idx >= 0) state.items[idx] = action.payload
      })
      .addCase(updateExpenseStatus.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
  },
})

export const { setExpenseFilters, openSubmitExpenseForm, closeSubmitExpenseForm } =
  expensesSlice.actions
export default expensesSlice.reducer
