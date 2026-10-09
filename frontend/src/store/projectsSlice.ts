import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { projectsApi } from '../services/projectsApi'
import type { Project, ProjectFilters, ProjectFormData } from '../types/project'
import { emptyProjectFilters } from '../types/project'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface ProjectsState {
  items: Project[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: ProjectFilters
  selectedProject: Project | null
  isFormOpen: boolean
  formMode: 'create' | 'edit'
}

const initialState: ProjectsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptyProjectFilters(),
  selectedProject: null,
  isFormOpen: false,
  formMode: 'create',
}

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (filters: ProjectFilters, { rejectWithValue }) => {
    try {
      const { data } = await projectsApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load projects'))
    }
  },
)

export const createProject = createAsyncThunk(
  'projects/create',
  async (payload: ProjectFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await projectsApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create project')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateProject = createAsyncThunk(
  'projects/update',
  async (
    { id, data: payload }: { id: number; data: ProjectFormData },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await projectsApi.update(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update project')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await projectsApi.destroy(id)
      dispatch(addNotification({ type: 'success', message: data.message }))
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete project')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjectFilters: (state, action: PayloadAction<ProjectFilters>) => {
      state.filters = action.payload
    },
    openCreateProjectForm: (state) => {
      state.formMode = 'create'
      state.selectedProject = null
      state.isFormOpen = true
    },
    openEditProjectForm: (state, action: PayloadAction<Project>) => {
      state.formMode = 'edit'
      state.selectedProject = action.payload
      state.isFormOpen = true
    },
    closeProjectForm: (state) => {
      state.isFormOpen = false
      state.selectedProject = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createProject.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.unshift(action.payload)
        state.isFormOpen = false
      })
      .addCase(createProject.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateProject.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const i = state.items.findIndex((p) => p.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
        state.isFormOpen = false
        state.selectedProject = null
      })
      .addCase(updateProject.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
      })
  },
})

export const {
  setProjectFilters,
  openCreateProjectForm,
  openEditProjectForm,
  closeProjectForm,
} = projectsSlice.actions

export default projectsSlice.reducer
