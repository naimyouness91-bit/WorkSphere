import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { jobsApi } from '../services/jobsApi'
import type { Job, JobFilters, JobFormData } from '../types/job'
import { emptyJobFilters } from '../types/job'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface JobsState {
  items: Job[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: JobFilters
  selectedJob: Job | null
  isFormOpen: boolean
  formMode: 'create' | 'edit'
}

const initialState: JobsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyJobFilters(),
  selectedJob: null,
  isFormOpen: false,
  formMode: 'create',
}

export const fetchJobs = createAsyncThunk(
  'jobs/fetchAll',
  async (filters: JobFilters, { rejectWithValue }) => {
    try {
      const { data } = await jobsApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load jobs'))
    }
  },
)

export const createJob = createAsyncThunk(
  'jobs/create',
  async (payload: JobFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await jobsApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Job created.' }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create job')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateJob = createAsyncThunk(
  'jobs/update',
  async ({ id, data: payload }: { id: number; data: JobFormData }, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await jobsApi.update(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Job updated.' }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update job')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteJob = createAsyncThunk(
  'jobs/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await jobsApi.destroy(id)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Job deleted.' }))
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete job')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobFilters: (state, action: PayloadAction<JobFilters>) => {
      state.filters = action.payload
    },
    openCreateJobForm: (state) => {
      state.formMode = 'create'
      state.selectedJob = null
      state.isFormOpen = true
    },
    openEditJobForm: (state, action: PayloadAction<Job>) => {
      state.formMode = 'edit'
      state.selectedJob = action.payload
      state.isFormOpen = true
    },
    closeJobForm: (state) => {
      state.isFormOpen = false
      state.selectedJob = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createJob.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.unshift(action.payload)
        state.isFormOpen = false
      })
      .addCase(updateJob.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const i = state.items.findIndex((j) => j.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
        state.isFormOpen = false
        state.selectedJob = null
      })
      .addCase(deleteJob.fulfilled, (state, action) => {
        state.items = state.items.filter((j) => j.id !== action.payload)
      })
  },
})

export const { setJobFilters, openCreateJobForm, openEditJobForm, closeJobForm } = jobsSlice.actions
export default jobsSlice.reducer
