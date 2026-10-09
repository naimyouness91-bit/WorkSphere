import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { integrationsApi } from '../services/integrationsApi'
import type {
  Integration,
  IntegrationFormData,
  IntegrationKpis,
  IntegrationLog,
  IntegrationServiceName,
  IntegrationUpdateData,
} from '../types/integration'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface IntegrationsState {
  items: Integration[]
  logs: IntegrationLog[]
  kpis: IntegrationKpis | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  logsStatus: 'idle' | 'loading' | 'succeeded'
  mutationStatus: 'idle' | 'loading'
  testStatus: 'idle' | 'loading'
  error: string | null
  editingService: IntegrationServiceName | null
  isConfigOpen: boolean
}

const initialState: IntegrationsState = {
  items: [],
  logs: [],
  kpis: null,
  status: 'idle',
  logsStatus: 'idle',
  mutationStatus: 'idle',
  testStatus: 'idle',
  error: null,
  editingService: null,
  isConfigOpen: false,
}

export const fetchIntegrations = createAsyncThunk(
  'integrations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await integrationsApi.index()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load integrations'))
    }
  },
)

export const fetchIntegrationLogs = createAsyncThunk(
  'integrations/fetchLogs',
  async (integrationId: number | undefined, { rejectWithValue }) => {
    try {
      const { data } = await integrationsApi.logs(integrationId)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load logs'))
    }
  },
)

export const fetchIntegrationSummary = createAsyncThunk(
  'integrations/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await integrationsApi.summary()
      return data.data.kpis
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load summary'))
    }
  },
)

export const createIntegration = createAsyncThunk(
  'integrations/create',
  async (payload: IntegrationFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await integrationsApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to save integration')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateIntegration = createAsyncThunk(
  'integrations/update',
  async (
    { id, data: payload }: { id: number; data: IntegrationUpdateData },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await integrationsApi.update(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update integration')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const toggleIntegrationStatus = createAsyncThunk(
  'integrations/toggle',
  async (
    { id, status }: { id: number; status: 'active' | 'inactive' },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await integrationsApi.update(id, { status })
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update status')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const testIntegration = createAsyncThunk(
  'integrations/test',
  async (
    { id, testEmail }: { id: number; testEmail?: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await integrationsApi.test(id, testEmail)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Integration test failed')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteIntegration = createAsyncThunk(
  'integrations/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await integrationsApi.destroy(id)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to remove integration')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const integrationsSlice = createSlice({
  name: 'integrations',
  initialState,
  reducers: {
    openIntegrationConfig: (state, action: PayloadAction<IntegrationServiceName>) => {
      state.editingService = action.payload
      state.isConfigOpen = true
    },
    closeIntegrationConfig: (state) => {
      state.isConfigOpen = false
      state.editingService = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIntegrations.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchIntegrations.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchIntegrations.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(fetchIntegrationLogs.fulfilled, (state, action) => {
        state.logsStatus = 'succeeded'
        state.logs = action.payload
      })
      .addCase(fetchIntegrationSummary.fulfilled, (state, action) => {
        state.kpis = action.payload
      })
      .addCase(createIntegration.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isConfigOpen = false
        state.editingService = null
        const idx = state.items.findIndex((i) => i.service_name === action.payload.service_name)
        if (idx >= 0) state.items[idx] = action.payload
        else state.items.push(action.payload)
      })
      .addCase(updateIntegration.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isConfigOpen = false
        state.editingService = null
        const idx = state.items.findIndex((i) => i.id === action.payload.id)
        if (idx >= 0) state.items[idx] = action.payload
      })
      .addCase(toggleIntegrationStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id)
        if (idx >= 0) state.items[idx] = action.payload
      })
      .addCase(testIntegration.pending, (state) => {
        state.testStatus = 'loading'
      })
      .addCase(testIntegration.fulfilled, (state, action) => {
        state.testStatus = 'idle'
        const idx = state.items.findIndex((i) => i.id === action.payload.id)
        if (idx >= 0) state.items[idx] = action.payload
      })
      .addCase(testIntegration.rejected, (state) => {
        state.testStatus = 'idle'
      })
      .addCase(deleteIntegration.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.id !== action.payload)
      })
      .addMatcher(
        (action) =>
          createIntegration.pending.match(action) ||
          updateIntegration.pending.match(action),
        (state) => {
          state.mutationStatus = 'loading'
        },
      )
      .addMatcher(
        (action) =>
          createIntegration.rejected.match(action) ||
          updateIntegration.rejected.match(action),
        (state) => {
          state.mutationStatus = 'idle'
        },
      )
  },
})

export const { openIntegrationConfig, closeIntegrationConfig } = integrationsSlice.actions
export default integrationsSlice.reducer
