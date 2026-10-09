import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { trainingsApi } from '../services/trainingsApi'
import type { Training, TrainingFilters, TrainingFormData } from '../types/training'
import { emptyTrainingFilters } from '../types/training'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface TrainingsState {
  items: Training[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: TrainingFilters
  selectedTraining: Training | null
  isFormOpen: boolean
  formMode: 'create' | 'edit'
}

const initialState: TrainingsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyTrainingFilters(),
  selectedTraining: null,
  isFormOpen: false,
  formMode: 'create',
}

export const fetchTrainings = createAsyncThunk(
  'trainings/fetchAll',
  async (filters: TrainingFilters, { rejectWithValue }) => {
    try {
      const { data } = await trainingsApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load trainings'))
    }
  },
)

export const createTraining = createAsyncThunk(
  'trainings/create',
  async (payload: TrainingFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await trainingsApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Training created.' }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create training')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateTraining = createAsyncThunk(
  'trainings/update',
  async (
    { id, data: payload }: { id: number; data: TrainingFormData },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await trainingsApi.update(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Training updated.' }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update training')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteTraining = createAsyncThunk(
  'trainings/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await trainingsApi.destroy(id)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Training deleted.' }))
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete training')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const trainingsSlice = createSlice({
  name: 'trainings',
  initialState,
  reducers: {
    setTrainingFilters: (state, action: PayloadAction<TrainingFilters>) => {
      state.filters = action.payload
    },
    openCreateTrainingForm: (state) => {
      state.formMode = 'create'
      state.selectedTraining = null
      state.isFormOpen = true
    },
    openEditTrainingForm: (state, action: PayloadAction<Training>) => {
      state.formMode = 'edit'
      state.selectedTraining = action.payload
      state.isFormOpen = true
    },
    closeTrainingForm: (state) => {
      state.isFormOpen = false
      state.selectedTraining = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrainings.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTrainings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchTrainings.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createTraining.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createTraining.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.push(action.payload)
        state.isFormOpen = false
      })
      .addCase(createTraining.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateTraining.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateTraining.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const i = state.items.findIndex((t) => t.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
        state.isFormOpen = false
        state.selectedTraining = null
      })
      .addCase(updateTraining.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(deleteTraining.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload)
      })
  },
})

export const {
  setTrainingFilters,
  openCreateTrainingForm,
  openEditTrainingForm,
  closeTrainingForm,
} = trainingsSlice.actions

export default trainingsSlice.reducer
