import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import i18n from '../i18n'
import { setAppLocale } from '../i18n'
import { authApi } from '../services/api'
import type { AppLocale } from '../i18n'
import type { AuthResponse, User, UserLocale } from '../types/auth'
import { extractApiError } from '../utils/errors'
import { normalizeLocale } from '../utils/language'

interface AuthState {
  user: User | null
  token: string | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('access_token'),
  status: 'idle',
  error: null,
}

function applyUserLocale(user: User) {
  const locale = normalizeLocale(user.locale) as AppLocale
  setAppLocale(locale)
}

export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await authApi.login(credentials)
      localStorage.setItem('access_token', data.access_token)
      applyUserLocale(data.user)
      return data
    } catch (err: unknown) {
      return rejectWithValue(
        extractApiError(err, i18n.t('auth.loginFailed')),
      )
    }
  },
)

export const register = createAsyncThunk(
  'auth/register',
  async (
    payload: {
      name: string
      email: string
      password: string
      password_confirmation: string
      locale?: UserLocale
    },
    { rejectWithValue },
  ) => {
    try {
      const { data } = await authApi.register({
        ...payload,
        locale: payload.locale ?? (i18n.language.split('-')[0] as UserLocale),
      })
      localStorage.setItem('access_token', data.access_token)
      applyUserLocale(data.user)
      return data
    } catch (err: unknown) {
      return rejectWithValue(
        extractApiError(err, i18n.t('auth.registerFailed')),
      )
    }
  },
)

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.me()
    applyUserLocale(data.user)
    return data.user
  } catch {
    localStorage.removeItem('access_token')
    return rejectWithValue(i18n.t('auth.sessionExpired'))
  }
})

export const updateUserLocale = createAsyncThunk(
  'auth/updateLocale',
  async (locale: UserLocale, { rejectWithValue }) => {
    try {
      const { data } = await authApi.updateLocale(locale)
      setAppLocale(locale)
      return data.user
    } catch (err: unknown) {
      return rejectWithValue(extractApiError(err, 'Failed to update language'))
    }
  },
)

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout()
  } finally {
    localStorage.removeItem('access_token')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    const handleAuthFulfilled = (
      state: AuthState,
      action: PayloadAction<AuthResponse>,
    ) => {
      state.status = 'succeeded'
      state.user = action.payload.user
      state.token = action.payload.access_token
      state.error = null
    }

    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, handleAuthFulfilled)
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? i18n.t('auth.loginFailed')
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(register.fulfilled, handleAuthFulfilled)
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed'
        state.error = (action.payload as string) ?? i18n.t('auth.registerFailed')
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'succeeded'
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.token = null
        state.status = 'idle'
      })
      .addCase(updateUserLocale.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.status = 'idle'
        state.error = null
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
