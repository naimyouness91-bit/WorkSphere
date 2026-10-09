import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { helpdeskApi } from '../services/helpdeskApi'
import type { Ticket, TicketFilters, TicketSubmitData, TicketUpdateData } from '../types/ticket'
import { emptyTicketFilters } from '../types/ticket'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface TicketsState {
  items: Ticket[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: TicketFilters
  selectedTicket: Ticket | null
  isManageOpen: boolean
  isSubmitOpen: boolean
}

const initialState: TicketsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyTicketFilters(),
  selectedTicket: null,
  isManageOpen: false,
  isSubmitOpen: false,
}

export const fetchTickets = createAsyncThunk(
  'tickets/fetchAll',
  async (filters: TicketFilters, { rejectWithValue }) => {
    try {
      const { data } = await helpdeskApi.getTickets(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load tickets'))
    }
  },
)

export const createTicket = createAsyncThunk(
  'tickets/create',
  async (payload: TicketSubmitData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await helpdeskApi.createTicket(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to submit ticket')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateTicket = createAsyncThunk(
  'tickets/update',
  async (
    { id, data: payload }: { id: number; data: TicketUpdateData },
    { rejectWithValue, dispatch },
  ) => {
    try {
      let ticket: Ticket | undefined
      let message = ''
      if (payload.assigned_to !== undefined) {
        const res = await helpdeskApi.assignTicket(id, payload.assigned_to ?? null)
        ticket = res.data.data
        message = res.data.message
      }
      if (payload.status) {
        const res = await helpdeskApi.updateStatus(id, payload.status)
        ticket = res.data.data
        message = res.data.message
      }
      if (!ticket) {
        const res = await helpdeskApi.getTicket(id)
        ticket = res.data.data
      }
      dispatch(addNotification({ type: 'success', message }))
      return ticket
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update ticket')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setTicketFilters: (state, action: PayloadAction<TicketFilters>) => {
      state.filters = action.payload
    },
    openSubmitTicketForm: (state) => {
      state.isSubmitOpen = true
    },
    closeSubmitTicketForm: (state) => {
      state.isSubmitOpen = false
    },
    openManageTicket: (state, action: PayloadAction<Ticket>) => {
      state.selectedTicket = action.payload
      state.isManageOpen = true
    },
    closeManageTicket: (state) => {
      state.isManageOpen = false
      state.selectedTicket = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createTicket.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.unshift(action.payload)
        state.isSubmitOpen = false
      })
      .addCase(createTicket.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateTicket.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const i = state.items.findIndex((t) => t.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
        state.isManageOpen = false
        state.selectedTicket = null
      })
      .addCase(updateTicket.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
  },
})

export const {
  setTicketFilters,
  openSubmitTicketForm,
  closeSubmitTicketForm,
  openManageTicket,
  closeManageTicket,
} = ticketsSlice.actions

export default ticketsSlice.reducer
