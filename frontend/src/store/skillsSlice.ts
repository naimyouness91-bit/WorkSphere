import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { skillsApi } from '../services/skillsApi'
import type { Skill, SkillFilters, SkillFormData } from '../types/skill'
import { emptySkillFilters } from '../types/skill'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface SkillsState {
  items: Skill[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  filters: SkillFilters
  selectedSkill: Skill | null
  isFormOpen: boolean
  formMode: 'create' | 'edit'
}

const initialState: SkillsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  filters: emptySkillFilters(),
  selectedSkill: null,
  isFormOpen: false,
  formMode: 'create',
}

export const fetchSkills = createAsyncThunk(
  'skills/fetchAll',
  async (filters: SkillFilters, { rejectWithValue }) => {
    try {
      const { data } = await skillsApi.index(filters)
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load skills'))
    }
  },
)

export const createSkill = createAsyncThunk(
  'skills/create',
  async (payload: SkillFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await skillsApi.store(payload)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Skill created.' }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create skill')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateSkill = createAsyncThunk(
  'skills/update',
  async (
    { id, data: payload }: { id: number; data: SkillFormData },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await skillsApi.update(id, payload)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Skill updated.' }))
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update skill')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteSkill = createAsyncThunk(
  'skills/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await skillsApi.destroy(id)
      dispatch(addNotification({ type: 'success', message: data.message ?? 'Skill deleted.' }))
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete skill')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const skillsSlice = createSlice({
  name: 'skills',
  initialState,
  reducers: {
    setSkillFilters: (state, action: PayloadAction<SkillFilters>) => {
      state.filters = action.payload
    },
    openCreateSkillForm: (state) => {
      state.formMode = 'create'
      state.selectedSkill = null
      state.isFormOpen = true
    },
    openEditSkillForm: (state, action: PayloadAction<Skill>) => {
      state.formMode = 'edit'
      state.selectedSkill = action.payload
      state.isFormOpen = true
    },
    closeSkillForm: (state) => {
      state.isFormOpen = false
      state.selectedSkill = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createSkill.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createSkill.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.push(action.payload)
        state.isFormOpen = false
      })
      .addCase(createSkill.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateSkill.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const i = state.items.findIndex((s) => s.id === action.payload.id)
        if (i !== -1) state.items[i] = action.payload
        state.isFormOpen = false
        state.selectedSkill = null
      })
      .addCase(updateSkill.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload)
      })
  },
})

export const {
  setSkillFilters,
  openCreateSkillForm,
  openEditSkillForm,
  closeSkillForm,
} = skillsSlice.actions

export default skillsSlice.reducer
