import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { employeesApi } from '../services/employeesApi'
import type { Employee, EmployeeFormData } from '../types/employee'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface EmployeesState {
  items: Employee[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  selectedEmployee: Employee | null
  isFormOpen: boolean
  isDeleteModalOpen: boolean
  employeeToDelete: Employee | null
}

const initialState: EmployeesState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  selectedEmployee: null,
  isFormOpen: false,
  isDeleteModalOpen: false,
  employeeToDelete: null,
}

export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await employeesApi.index()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load employees'))
    }
  },
)

export const createEmployee = createAsyncThunk(
  'employees/create',
  async (payload: EmployeeFormData, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await employeesApi.store(payload)
      dispatch(
        addNotification({
          type: 'success',
          message: data.message ?? 'Employee created successfully.',
        }),
      )
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to create employee')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async (
    { id, data: payload }: { id: number; data: EmployeeFormData },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const { data } = await employeesApi.update(id, payload)
      dispatch(
        addNotification({
          type: 'success',
          message: data.message ?? 'Employee updated successfully.',
        }),
      )
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to update employee')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await employeesApi.destroy(id)
      dispatch(
        addNotification({
          type: 'success',
          message: data.message ?? 'Employee deleted successfully.',
        }),
      )
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete employee')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const employeesSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    openCreateForm: (state) => {
      state.selectedEmployee = null
      state.isFormOpen = true
    },
    openEditForm: (state, action) => {
      state.selectedEmployee = action.payload
      state.isFormOpen = true
    },
    closeForm: (state) => {
      state.isFormOpen = false
      state.selectedEmployee = null
    },
    openDeleteModal: (state, action) => {
      state.employeeToDelete = action.payload
      state.isDeleteModalOpen = true
    },
    closeDeleteModal: (state) => {
      state.isDeleteModalOpen = false
      state.employeeToDelete = null
    },
    clearEmployeesError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(createEmployee.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items.push(action.payload)
        state.isFormOpen = false
      })
      .addCase(createEmployee.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(updateEmployee.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        const index = state.items.findIndex((e) => e.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
        state.isFormOpen = false
        state.selectedEmployee = null
      })
      .addCase(updateEmployee.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(deleteEmployee.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.items = state.items.filter((e) => e.id !== action.payload)
        state.isDeleteModalOpen = false
        state.employeeToDelete = null
      })
      .addCase(deleteEmployee.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
  },
})

export const {
  openCreateForm,
  openEditForm,
  closeForm,
  openDeleteModal,
  closeDeleteModal,
  clearEmployeesError,
} = employeesSlice.actions

export default employeesSlice.reducer
