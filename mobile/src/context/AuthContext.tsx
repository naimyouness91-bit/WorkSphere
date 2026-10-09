import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import * as LocalAuthentication from 'expo-local-authentication'
import { authApi, type User } from '../api/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  biometricLogin: () => Promise<boolean>
  biometricAvailable: boolean
  enableBiometric: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [biometricAvailable, setBiometricAvailable] = useState(false)

  const loadSession = useCallback(async () => {
    const token = await SecureStore.getItemAsync('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const { data } = await authApi.me()
      setUser(data.user)
    } catch {
      await SecureStore.deleteItemAsync('access_token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSession()
    LocalAuthentication.hasHardwareAsync().then(setBiometricAvailable)
  }, [loadSession])

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password)
    await SecureStore.setItemAsync('access_token', data.access_token)
    setUser(data.user)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      /* ignore */
    }
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('biometric_email')
    await SecureStore.deleteItemAsync('biometric_password')
    setUser(null)
  }

  const enableBiometric = async (email: string, password: string) => {
    await SecureStore.setItemAsync('biometric_email', email)
    await SecureStore.setItemAsync('biometric_password', password)
  }

  const biometricLogin = async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign in to WorkSphere',
      fallbackLabel: 'Use password',
    })
    if (!result.success) return false

    const email = await SecureStore.getItemAsync('biometric_email')
    const password = await SecureStore.getItemAsync('biometric_password')
    if (!email || !password) return false

    await login(email, password)
    return true
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        biometricLogin,
        biometricAvailable,
        enableBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
