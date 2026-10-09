import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { applicationsApi } from '../services/applicationsApi'
import type {
  Application,
  ApplicationApplyData,
  ApplicationFilters,
  ApplicationStatus,
} from '../types/application'
import { emptyApplicationFilters } from '../types/application'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface ApplicationsState {
  items: Application[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: ApplicationFilters
}

const initialState: ApplicationsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyApplicationFilters(),
}

export const fetchApplications = createAsyncThunk(
  'applications/fetchAll',
  async (filters: ApplicationFilters, { rejectWithValue }) => {
    try {
      const { data } = await applicationsApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load applications'))
    }
  },
)

export const submitApplication = createAsyncThunk(
  'applications/submit',
  async (payload: ApplicationApplyData, { rejectWithValue, dispatch }) => {
    const formData = new FormData()
    formData.append('job_id', String(payload.job_id))
    formData.append('candidate_name', payload.candidate_name)
    formData.append('candidate_email', payload.candidate_email)
    formData.append('resume', payload.resume)

    try {
      const { data } = await applicationsApi.store(formData)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Application submitted.' }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to submit application')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateApplicationStatus = createAsyncThunk(
  'applications/updateStatus',
  async (
    { id, status }: { id: number; status: ApplicationStatus },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await applicationsApi.updateStatus(id, status)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Status updated.' }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update application')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteApplication = createAsyncThunk(
  'applications/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await applicationsApi.destroy(id)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Application deleted.' }))
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete application')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    setApplicationFilters: (state, action: PayloadAction<ApplicationFilters>) => {
      state.filters = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(submitApplication.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(submitApplication.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.unshift(action.payload)
      })
      .addCase(submitApplication.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const i = state.items.findIndex((a) => a.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
      })
      .addCase(deleteApplication.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a.id !== action.payload)
      })
  },
})

export const { setApplicationFilters } = applicationsSlice.actions
export default applicationsSlice.reducer
