import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { tasksApi } from '../services/tasksApi'
import type { Task, TaskFilters, TaskFormData } from '../types/task'
import { emptyTaskFilters } from '../types/task'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface TasksState {
  items: Task[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: TaskFilters
  selectedTask: Task | null
  isFormOpen: boolean
  formMode: 'create' | 'edit'
}

const initialState: TasksState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyTaskFilters(),
  selectedTask: null,
  isFormOpen: false,
  formMode: 'create',
}

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (filters: TaskFilters, { rejectWithValue }) => {
    try {
      const { data } = await tasksApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load tasks'))
    }
  },
)

export const createTask = createAsyncThunk(
  'tasks/create',
  async (payload: TaskFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await tasksApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create task')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateTask = createAsyncThunk(
  'tasks/update',
  async (
    { id, data: payload }: { id: number; data: Partial<TaskFormData> },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await tasksApi.update(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update task')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const completeTask = createAsyncThunk(
  'tasks/complete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await tasksApi.complete(id)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to complete task')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await tasksApi.destroy(id)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete task')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setTaskFilters: (state, action: PayloadAction<TaskFilters>) => {
      state.filters = action.payload
    },
    openCreateTaskForm: (state) => {
      state.formMode = 'create'
      state.selectedTask = null
      state.isFormOpen = true
    },
    openEditTaskForm: (state, action: PayloadAction<Task>) => {
      state.formMode = 'edit'
      state.selectedTask = action.payload
      state.isFormOpen = true
    },
    closeTaskForm: (state) => {
      state.isFormOpen = false
      state.selectedTask = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createTask.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.push(action.payload)
        state.isFormOpen = false
      })
      .addCase(createTask.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateTask.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const i = state.items.findIndex((t) => t.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
        state.isFormOpen = false
        state.selectedTask = null
      })
      .addCase(updateTask.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        const i = state.items.findIndex((t) => t.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload)
      })
  },
})

export const {
  setTaskFilters,
  openCreateTaskForm,
  openEditTaskForm,
  closeTaskForm,
} = tasksSlice.actions

export default tasksSlice.reducer
