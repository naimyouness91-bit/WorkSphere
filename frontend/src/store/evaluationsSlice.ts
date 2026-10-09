import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { evaluationsApi } from '../services/evaluationsApi'
import type {
  Evaluation,
  EvaluationFilters,
  EvaluationFormData,
  EvaluationSummary,
} from '../types/evaluation'
import { emptyEvaluationFilters } from '../types/evaluation'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface EvaluationsState {
  items: Evaluation[]
  summary: EvaluationSummary | null
  departments: string[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  summaryStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: EvaluationFilters
  selectedEvaluation: Evaluation | null
  isFormOpen: boolean
  formMode: 'create' | 'edit'
}

const initialState: EvaluationsState = {
  items: [],
  summary: null,
  departments: [],
  status: 'idle',
  summaryStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyEvaluationFilters(),
  selectedEvaluation: null,
  isFormOpen: false,
  formMode: 'create',
}

export const fetchEvaluations = createAsyncThunk(
  'evaluations/fetchAll',
  async (filters: EvaluationFilters, { rejectWithValue }) => {
    try {
      const { data } = await evaluationsApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load evaluations'))
    }
  },
)

export const fetchEvaluationSummary = createAsyncThunk(
  'evaluations/fetchSummary',
  async (filters: EvaluationFilters, { rejectWithValue }) => {
    try {
      const { data } = await evaluationsApi.summary(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load evaluation summary'))
    }
  },
)

export const fetchEvaluationDepartments = createAsyncThunk(
  'evaluations/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await evaluationsApi.departments()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load departments'))
    }
  },
)

export const createEvaluation = createAsyncThunk(
  'evaluations/create',
  async (payload: EvaluationFormData, { rejectWithValue, dispatch, getState }) => {
    try {
      const { data } = await evaluationsApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Evaluation created.' }))
      const filters = (getState() as { evaluations: EvaluationsState }).evaluations.filters
      dispatch(fetchEvaluationSummary(filters))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create evaluation')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateEvaluation = createAsyncThunk(
  'evaluations/update',
  async (
    { id, data: payload }: { id: number; data: EvaluationFormData },
    { rejectWithValue, dispatch, getState },
  ) => {
    try {
      const { data } = await evaluationsApi.update(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Evaluation updated.' }))
      const filters = (getState() as { evaluations: EvaluationsState }).evaluations.filters
      dispatch(fetchEvaluationSummary(filters))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update evaluation')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const evaluationsSlice = createSlice({
  name: 'evaluations',
  initialState,
  reducers: {
    setEvaluationFilters: (state, action: PayloadAction<EvaluationFilters>) => {
      state.filters = action.payload
    },
    openCreateEvaluationForm: (state) => {
      state.formMode = 'create'
      state.selectedEvaluation = null
      state.isFormOpen = true
    },
    openEditEvaluationForm: (state, action: PayloadAction<Evaluation>) => {
      state.formMode = 'edit'
      state.selectedEvaluation = action.payload
      state.isFormOpen = true
    },
    closeEvaluationForm: (state) => {
      state.isFormOpen = false
      state.selectedEvaluation = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvaluations.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEvaluations.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchEvaluations.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchEvaluationSummary.fulfilled, (state, action) => {
        state.summaryStatus = 'succeeded'
        state.summary = action.payload
      })
      .addCase(fetchEvaluationDepartments.fulfilled, (state, action) => {
        state.departments = action.payload
      })
      .addCase(createEvaluation.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createEvaluation.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.unshift(action.payload)
        state.isFormOpen = false
      })
      .addCase(createEvaluation.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateEvaluation.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateEvaluation.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const i = state.items.findIndex((e) => e.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
        state.isFormOpen = false
        state.selectedEvaluation = null
      })
      .addCase(updateEvaluation.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
  },
})

export const {
  setEvaluationFilters,
  openCreateEvaluationForm,
  openEditEvaluationForm,
  closeEvaluationForm,
} = evaluationsSlice.actions

export default evaluationsSlice.reducer
