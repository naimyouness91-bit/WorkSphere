import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { requestsApi } from '../services/requestsApi'
import type {
  InternalRequest,
  InternalRequestFormData,
} from '../types/internalRequest'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface RequestsState {
  items: InternalRequest[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  isFormOpen: boolean
}

const initialState: RequestsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  isFormOpen: false,
}

export const fetchRequests = createAsyncThunk(
  'requests/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await requestsApi.index()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load requests'))
    }
  },
)

export const createRequest = createAsyncThunk(
  'requests/create',
  async (payload: InternalRequestFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await requestsApi.store(payload)
      dispatch(
        addNotification({
          type: 'success',
          message: data.message ?? 'Request submitted successfully.',
        }),
      )
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to submit request')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const approveRequest = createAsyncThunk(
  'requests/approve',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await requestsApi.update(id, 'approved')
      dispatch(
        addNotification({
          type: 'success',
          message: data.message ?? 'Request approved.',
        }),
      )
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to approve request')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const rejectRequest = createAsyncThunk(
  'requests/reject',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await requestsApi.update(id, 'rejected')
      dispatch(
        addNotification({
          type: 'success',
          message: data.message ?? 'Request rejected.',
        }),
      )
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to reject request')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const requestsSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    openRequestForm: (state) => {
      state.isFormOpen = true
    },
    closeRequestForm: (state) => {
      state.isFormOpen = false
    },
    clearRequestsError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const updateItem = (state: RequestsState, item: InternalRequest) => {
      const index = state.items.findIndex((r) => r.id === item.id)
      if (index !== -1) {
        state.items[index] = item
      }
    }

    builder
      .addCase(fetchRequests.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createRequest.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.unshift(action.payload)
        state.isFormOpen = false
      })
      .addCase(createRequest.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(approveRequest.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        updateItem(state, action.payload)
      })
      .addCase(approveRequest.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(rejectRequest.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        updateItem(state, action.payload)
      })
      .addCase(rejectRequest.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
  },
})

export const { openRequestForm, closeRequestForm, clearRequestsError } =
  requestsSlice.actions

export default requestsSlice.reducer
