import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { documentsApi } from '../services/documentsApi'
import type { Document, DocumentFormData } from '../types/document'
import { extractApiError } from '../utils/errors'
import { addNotification } from './notificationSlice'

interface DocumentsState {
  items: Document[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  mutationStatus: 'idle' | 'loading'
  error: string | null
  isUploadOpen: boolean
  documentToDelete: Document | null
  isDeleteModalOpen: boolean
  previewDocument: Document | null
}

const initialState: DocumentsState = {
  items: [],
  status: 'idle',
  mutationStatus: 'idle',
  error: null,
  isUploadOpen: false,
  documentToDelete: null,
  isDeleteModalOpen: false,
  previewDocument: null,
}

export const fetchDocuments = createAsyncThunk(
  'documents/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await documentsApi.index()
      return data.data
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to load documents'))
    }
  },
)

export const uploadDocument = createAsyncThunk(
  'documents/upload',
  async (payload: DocumentFormData, { rejectWithValue, dispatch }) => {
    if (!payload.file) {
      return rejectWithValue('Please select a file')
    }

    const formData = new FormData()
    formData.append('title', payload.title)
    if (payload.description) {
      formData.append('description', payload.description)
    }
    formData.append('file', payload.file)

    try {
      const { data } = await documentsApi.store(formData)
      dispatch(
        addNotification({
          type: 'success',
          message: data.message,
        }),
      )
      return data.data
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to upload document')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

export const deleteDocument = createAsyncThunk(
  'documents/delete',
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await documentsApi.destroy(id)
      dispatch(
        addNotification({
          type: 'success',
          message: data.message,
        }),
      )
      return id
    } catch (err: unknown) {
      const message = extractApiError(err, 'Failed to delete document')
      dispatch(addNotification({ type: 'error', message }))
      return rejectWithValue(message)
    }
  },
)

const documentsSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    openUploadForm: (state) => {
      state.isUploadOpen = true
    },
    closeUploadForm: (state) => {
      state.isUploadOpen = false
    },
    openDeleteModal: (state, action: PayloadAction<Document>) => {
      state.documentToDelete = action.payload
      state.isDeleteModalOpen = true
    },
    closeDeleteModal: (state) => {
      state.documentToDelete = null
      state.isDeleteModalOpen = false
    },
    openPreview: (state, action: PayloadAction<Document>) => {
      state.previewDocument = action.payload
    },
    closePreview: (state) => {
      state.previewDocument = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload as string
      })
      .addCase(uploadDocument.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isUploadOpen = false
        state.items.unshift(action.payload)
      })
      .addCase(uploadDocument.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
      .addCase(deleteDocument.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.mutationStatus = 'idle'
        state.isDeleteModalOpen = false
        state.documentToDelete = null
        state.items = state.items.filter((d) => d.id !== action.payload)
        if (state.previewDocument?.id === action.payload) {
          state.previewDocument = null
        }
      })
      .addCase(deleteDocument.rejected, (state) => {
        state.mutationStatus = 'idle'
      })
  },
})

export const {
  openUploadForm,
  closeUploadForm,
  openDeleteModal,
  closeDeleteModal,
  openPreview,
  closePreview,
} = documentsSlice.actions

export default documentsSlice.reducer
